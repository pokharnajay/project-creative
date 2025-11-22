import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPaymentSignature, fetchPaymentDetails } from '@/lib/razorpay';
import { verifyPaymentSchema, validateAndSanitize, getIpAddress, getUserAgent } from '@/lib/validation';
import { rateLimit, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';

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
      console.log('Payment verify: Unauthorized - no user');
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to continue.' },
        { status: 401 }
      );
    }

    // Rate limiting
    const rateLimitKey = createRateLimitKey(user.id, ipAddress, 'payment-verify');
    const rateLimitError = rateLimit(rateLimitKey, RATE_LIMITS.PAYMENT_VERIFY);

    if (rateLimitError) {
      console.log('Payment verify: Rate limited', user.id);
      return NextResponse.json(rateLimitError, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Payment verify: Received body', {
      order_id: body.razorpay_order_id,
      payment_id: body.razorpay_payment_id,
      has_signature: !!body.razorpay_signature
    });

    const validation = validateAndSanitize(verifyPaymentSchema, body);

    if (!validation.success) {
      console.log('Payment verify: Validation failed', validation.error);
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
      console.log('Payment verify: Invalid signature', { razorpay_order_id, razorpay_payment_id });
      return NextResponse.json(
        { error: 'Payment verification failed. Invalid signature.' },
        { status: 400 }
      );
    }

    console.log('Payment verify: Signature valid, fetching payment record');

    // Get payment record from database
    const { data: payment, error: paymentFetchError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    if (paymentFetchError) {
      console.error('Payment verify: Error fetching payment', paymentFetchError);
      return NextResponse.json(
        { error: 'Payment record not found. Please contact support.' },
        { status: 404 }
      );
    }

    if (!payment) {
      console.log('Payment verify: Payment not found', { razorpay_order_id, user_id: user.id });
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    console.log('Payment verify: Found payment', { id: payment.id, status: payment.status, credits: payment.credits_purchased });

    // Check if payment was already processed (idempotency)
    if (payment.status === 'completed') {
      console.log('Payment verify: Already completed');
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        creditsAdded: payment.credits_purchased,
        alreadyProcessed: true,
      });
    }

    // Fetch payment details from Razorpay to verify
    let razorpayPayment;
    try {
      razorpayPayment = await fetchPaymentDetails(razorpay_payment_id);
      console.log('Payment verify: Razorpay payment details', { status: razorpayPayment?.status, method: razorpayPayment?.method });
    } catch (error) {
      console.error('Payment verify: Error fetching Razorpay details', error);
      // Continue anyway, signature was valid
    }

    // Update payment record to completed FIRST
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'completed',
        payment_method: razorpayPayment?.method || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .eq('status', 'created'); // Only update if still in created status (prevents double processing)

    if (updatePaymentError) {
      console.error('Payment verify: Error updating payment status', updatePaymentError);
      // Check if it was already processed
      const { data: checkPayment } = await supabaseAdmin
        .from('payments')
        .select('status')
        .eq('id', payment.id)
        .single();

      if (checkPayment?.status === 'completed') {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          creditsAdded: payment.credits_purchased,
          alreadyProcessed: true,
        });
      }

      return NextResponse.json(
        { error: 'Failed to process payment. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('Payment verify: Payment status updated to completed');

    // Get current user credits
    const { data: currentUser, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (userFetchError) {
      console.error('Payment verify: Error fetching user credits', userFetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user credits. Please contact support.' },
        { status: 500 }
      );
    }

    const currentCredits = currentUser?.credits || 0;
    const newCredits = currentCredits + payment.credits_purchased;

    console.log('Payment verify: Updating credits', { currentCredits, adding: payment.credits_purchased, newCredits });

    // Add credits to user
    const { error: updateCreditsError } = await supabaseAdmin
      .from('users')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (updateCreditsError) {
      console.error('Payment verify: Error updating user credits', updateCreditsError);
      // Revert payment status
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed', error_message: 'Failed to add credits' })
        .eq('id', payment.id);

      return NextResponse.json(
        { error: 'Failed to add credits. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('Payment verify: Credits added successfully');

    // Create credit transaction record (optional, don't fail if this errors)
    try {
      await supabaseAdmin
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: payment.credits_purchased,
          type: 'purchase',
          description: `Credit purchase - $${payment.amount_usd}`,
          payment_id: payment.id,
        });
    } catch (txError) {
      console.error('Payment verify: Error creating transaction record', txError);
      // Don't fail - credits were added
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      creditsAdded: payment.credits_purchased,
      totalCredits: newCredits,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Payment verify: Unexpected error', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
