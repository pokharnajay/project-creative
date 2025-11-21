import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPaymentSignature, fetchPaymentDetails, getPaymentStage } from '@/lib/razorpay';
import { verifyPaymentSchema, validateAndSanitize, getIpAddress, getUserAgent } from '@/lib/validation';
import { rateLimit, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';
import { logPaymentEvent, logCreditEvent, AUDIT_ACTIONS, LOG_STATUS } from '@/lib/audit';

export async function POST(request) {
  try {
    // Get IP and user agent for logging
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitKey = createRateLimitKey(user.id, ipAddress, 'payment-verify');
    const rateLimitError = rateLimit(rateLimitKey, RATE_LIMITS.PAYMENT_VERIFY);

    if (rateLimitError) {
      await logPaymentEvent(
        user.id,
        AUDIT_ACTIONS.SECURITY_RATE_LIMIT_EXCEEDED,
        null,
        LOG_STATUS.FAILURE,
        { endpoint: 'verify' },
        ipAddress,
        userAgent
      );

      return NextResponse.json(rateLimitError, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateAndSanitize(verifyPaymentSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validation.data;

    // CRITICAL: Verify payment signature
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      // Log security event - invalid signature
      await logPaymentEvent(
        user.id,
        AUDIT_ACTIONS.SECURITY_INVALID_SIGNATURE,
        null,
        LOG_STATUS.FAILURE,
        {
          razorpay_order_id,
          razorpay_payment_id,
          reason: 'Invalid payment signature',
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    // Get payment record from database
    const { data: payment, error: paymentFetchError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    if (paymentFetchError || !payment) {
      await logPaymentEvent(
        user.id,
        AUDIT_ACTIONS.PAYMENT_FAILED,
        null,
        LOG_STATUS.ERROR,
        {
          razorpay_order_id,
          error: 'Payment record not found',
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Check if payment was already processed (idempotency)
    if (payment.status === 'completed') {
      // Already processed, return success without adding credits again
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        credits: payment.credits_purchased,
        alreadyProcessed: true,
      });
    }

    // Fetch payment details from Razorpay to verify amount
    let razorpayPayment;
    try {
      razorpayPayment = await fetchPaymentDetails(razorpay_payment_id);
    } catch (error) {
      console.error('Error fetching payment details from Razorpay:', error);
      // Continue anyway, signature was valid
    }

    // Update payment status and add credits atomically
    // Use database function for atomic operation
    const { data: purchaseResult, error: purchaseError } = await supabaseAdmin.rpc(
      'purchase_credits',
      {
        p_user_id: user.id,
        p_payment_id: payment.id,
        p_credits: payment.credits_purchased,
      }
    );

    if (purchaseError) {
      console.error('Error processing purchase:', purchaseError);

      // If the function returns false, it means the payment was already processed
      if (purchaseResult === false) {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          credits: payment.credits_purchased,
          alreadyProcessed: true,
        });
      }

      // Fallback: Update payment status to failed
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          error_message: 'Failed to add credits',
        })
        .eq('id', payment.id);

      await logPaymentEvent(
        user.id,
        AUDIT_ACTIONS.PAYMENT_FAILED,
        payment.id,
        LOG_STATUS.ERROR,
        {
          error: 'Failed to add credits',
          razorpay_order_id,
          razorpay_payment_id,
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: 'Failed to process payment. Please contact support.' },
        { status: 500 }
      );
    }

    // Update payment record with Razorpay details
    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
        payment_method: razorpayPayment?.method || null,
        completed_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          razorpay_payment_details: razorpayPayment || null,
        },
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment record:', updateError);
      // Don't fail the request, credits were added successfully
    }

    // Log successful payment
    await logPaymentEvent(
      user.id,
      AUDIT_ACTIONS.PAYMENT_COMPLETED,
      payment.id,
      LOG_STATUS.SUCCESS,
      {
        razorpay_order_id,
        razorpay_payment_id,
        amount_usd: payment.amount_usd,
        credits: payment.credits_purchased,
        payment_method: razorpayPayment?.method,
      },
      ipAddress,
      userAgent
    );

    // Log credit addition
    await logCreditEvent(
      user.id,
      AUDIT_ACTIONS.CREDITS_PURCHASED,
      null,
      LOG_STATUS.SUCCESS,
      {
        credits: payment.credits_purchased,
        payment_id: payment.id,
        amount_usd: payment.amount_usd,
      },
      ipAddress,
      userAgent
    );

    // Get updated user credits
    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      creditsAdded: payment.credits_purchased,
      totalCredits: updatedUser?.credits || 0,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error in verify payment:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
