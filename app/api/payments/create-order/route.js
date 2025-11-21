import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  createRazorpayOrder,
  calculateCredits,
  getPaymentStage,
  isValidPaymentAmount,
  CREDITS_PER_DOLLAR,
  MIN_PURCHASE_USD,
  MAX_PURCHASE_USD,
} from '@/lib/razorpay';
import { createPaymentSchema, validateAndSanitize, getIpAddress, getUserAgent } from '@/lib/validation';
import { rateLimit, RATE_LIMITS, createRateLimitKey } from '@/lib/rate-limit';
import { logPaymentEvent, AUDIT_ACTIONS, LOG_STATUS } from '@/lib/audit';

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
    const rateLimitKey = createRateLimitKey(user.id, ipAddress, 'payment-create');
    const rateLimitError = rateLimit(rateLimitKey, RATE_LIMITS.PAYMENT_CREATE);

    if (rateLimitError) {
      await logPaymentEvent(
        user.id,
        AUDIT_ACTIONS.SECURITY_RATE_LIMIT_EXCEEDED,
        null,
        LOG_STATUS.FAILURE,
        { endpoint: 'create-order' },
        ipAddress,
        userAgent
      );

      return NextResponse.json(rateLimitError, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateAndSanitize(createPaymentSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { amountUsd } = validation.data;

    // Additional validation
    if (!isValidPaymentAmount(amountUsd)) {
      return NextResponse.json(
        { error: `Amount must be between $${MIN_PURCHASE_USD} and $${MAX_PURCHASE_USD}` },
        { status: 400 }
      );
    }

    // Get user email for Razorpay
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create Razorpay order
    const orderResult = await createRazorpayOrder(
      amountUsd,
      user.id,
      userProfile.email
    );

    if (!orderResult.success) {
      await logPaymentEvent(
        user.id,
        AUDIT_ACTIONS.PAYMENT_FAILED,
        null,
        LOG_STATUS.ERROR,
        { error: 'Failed to create Razorpay order', amountUsd },
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: 'Failed to create payment order. Please try again.' },
        { status: 500 }
      );
    }

    // Save payment record to database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: orderResult.orderId,
        amount_usd: amountUsd,
        amount_inr: orderResult.amountInr,
        credits_purchased: orderResult.credits,
        status: 'created',
        payment_stage: getPaymentStage(),
        metadata: {
          user_email: userProfile.email,
          user_name: userProfile.name,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment to database:', paymentError);
      // Don't fail the request, as the order is already created in Razorpay
    }

    // Log the successful order creation
    await logPaymentEvent(
      user.id,
      AUDIT_ACTIONS.PAYMENT_ORDER_CREATED,
      payment?.id,
      LOG_STATUS.SUCCESS,
      {
        razorpay_order_id: orderResult.orderId,
        amount_usd: amountUsd,
        credits: orderResult.credits,
        payment_stage: getPaymentStage(),
      },
      ipAddress,
      userAgent
    );

    // Return order details for client-side checkout
    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      amount: amountUsd,
      amountInr: orderResult.amountInr,
      currency: 'INR',
      credits: orderResult.credits,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: userProfile.name || '',
        email: userProfile.email || '',
      },
      notes: {
        userId: user.id,
        credits: orderResult.credits,
      },
    });
  } catch (error) {
    console.error('Error in create-order:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
