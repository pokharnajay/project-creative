import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { logPaymentEvent, AUDIT_ACTIONS, LOG_STATUS } from '@/lib/audit';
import { getIpAddress, getUserAgent } from '@/lib/validation';

/**
 * Razorpay Webhook Handler
 *
 * This endpoint handles webhook events from Razorpay for payment status updates.
 * It serves as a backup mechanism to ensure payments are processed even if the
 * client-side verification fails.
 *
 * CRITICAL SECURITY:
 * - Webhook signature MUST be verified before processing
 * - All events are logged for audit purposes
 * - Idempotency is ensured to prevent double-charging
 */
export async function POST(request) {
  try {
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Get the Razorpay signature from headers
    const razorpaySignature = request.headers.get('x-razorpay-signature');

    if (!razorpaySignature) {
      console.error('Webhook: Missing Razorpay signature');

      await logPaymentEvent(
        null,
        AUDIT_ACTIONS.SECURITY_INVALID_SIGNATURE,
        null,
        LOG_STATUS.FAILURE,
        {
          reason: 'Missing webhook signature',
          ip: ipAddress,
        },
        ipAddress,
        userAgent
      );

      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook: RAZORPAY_WEBHOOK_SECRET not configured');
      // Still process in sandbox mode for testing
      if (process.env.PAYMENT_STAGE !== 'sandbox') {
        return NextResponse.json(
          { error: 'Webhook not configured' },
          { status: 500 }
        );
      }
    } else {
      const isValidSignature = verifyWebhookSignature(
        rawBody,
        razorpaySignature,
        webhookSecret
      );

      if (!isValidSignature) {
        console.error('Webhook: Invalid signature');

        await logPaymentEvent(
          null,
          AUDIT_ACTIONS.SECURITY_INVALID_SIGNATURE,
          null,
          LOG_STATUS.FAILURE,
          {
            reason: 'Invalid webhook signature',
            ip: ipAddress,
          },
          ipAddress,
          userAgent
        );

        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    console.log(`Webhook received: ${event}`);

    // Handle different event types
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(paymentEntity, ipAddress, userAgent);
        break;

      case 'payment.failed':
        await handlePaymentFailed(paymentEntity, ipAddress, userAgent);
        break;

      case 'payment.authorized':
        // Log but don't process - wait for capture
        console.log('Payment authorized:', paymentEntity?.id);
        break;

      case 'refund.created':
        await handleRefundCreated(payload.payload?.refund?.entity, ipAddress, userAgent);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 to prevent Razorpay from retrying
    // Log the error for investigation
    return NextResponse.json({ received: true, error: 'Internal error logged' });
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(paymentEntity, ipAddress, userAgent) {
  if (!paymentEntity) return;

  const orderId = paymentEntity.order_id;
  const paymentId = paymentEntity.id;

  // Get payment record from database
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single();

  if (fetchError || !payment) {
    console.error('Webhook: Payment record not found for order:', orderId);
    return;
  }

  // Check if already processed (idempotency)
  if (payment.status === 'completed') {
    console.log('Webhook: Payment already processed:', orderId);
    return;
  }

  // Process the payment using atomic function
  const { data: purchaseResult, error: purchaseError } = await supabaseAdmin.rpc(
    'purchase_credits',
    {
      p_user_id: payment.user_id,
      p_payment_id: payment.id,
      p_credits: payment.credits_purchased,
    }
  );

  if (purchaseError) {
    console.error('Webhook: Error processing purchase:', purchaseError);

    if (purchaseResult === false) {
      console.log('Webhook: Payment already processed via verification');
      return;
    }

    await logPaymentEvent(
      payment.user_id,
      AUDIT_ACTIONS.PAYMENT_FAILED,
      payment.id,
      LOG_STATUS.ERROR,
      {
        error: 'Webhook failed to add credits',
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
      },
      ipAddress,
      userAgent
    );
    return;
  }

  // Update payment record
  await supabaseAdmin
    .from('payments')
    .update({
      razorpay_payment_id: paymentId,
      status: 'completed',
      payment_method: paymentEntity.method,
      completed_at: new Date().toISOString(),
      metadata: {
        ...payment.metadata,
        webhook_processed: true,
        razorpay_payment_entity: paymentEntity,
      },
    })
    .eq('id', payment.id);

  // Log successful payment via webhook
  await logPaymentEvent(
    payment.user_id,
    AUDIT_ACTIONS.PAYMENT_COMPLETED,
    payment.id,
    LOG_STATUS.SUCCESS,
    {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount_usd: payment.amount_usd,
      credits: payment.credits_purchased,
      processed_via: 'webhook',
    },
    ipAddress,
    userAgent
  );

  console.log(`Webhook: Payment processed successfully. Credits added: ${payment.credits_purchased}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(paymentEntity, ipAddress, userAgent) {
  if (!paymentEntity) return;

  const orderId = paymentEntity.order_id;
  const paymentId = paymentEntity.id;
  const errorDescription = paymentEntity.error_description || 'Payment failed';

  // Get payment record
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single();

  if (fetchError || !payment) {
    console.error('Webhook: Payment record not found for failed payment:', orderId);
    return;
  }

  // Don't override completed payments
  if (payment.status === 'completed') {
    console.log('Webhook: Ignoring failed event for completed payment:', orderId);
    return;
  }

  // Update payment status to failed
  await supabaseAdmin
    .from('payments')
    .update({
      razorpay_payment_id: paymentId,
      status: 'failed',
      error_message: errorDescription,
      metadata: {
        ...payment.metadata,
        failure_reason: paymentEntity.error_reason,
        error_code: paymentEntity.error_code,
      },
    })
    .eq('id', payment.id);

  // Log failed payment
  await logPaymentEvent(
    payment.user_id,
    AUDIT_ACTIONS.PAYMENT_FAILED,
    payment.id,
    LOG_STATUS.FAILURE,
    {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      error: errorDescription,
      error_code: paymentEntity.error_code,
    },
    ipAddress,
    userAgent
  );

  console.log(`Webhook: Payment failed: ${orderId} - ${errorDescription}`);
}

/**
 * Handle refund creation
 */
async function handleRefundCreated(refundEntity, ipAddress, userAgent) {
  if (!refundEntity) return;

  const paymentId = refundEntity.payment_id;

  // Get payment record by Razorpay payment ID
  const { data: payment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('razorpay_payment_id', paymentId)
    .single();

  if (fetchError || !payment) {
    console.error('Webhook: Payment not found for refund:', paymentId);
    return;
  }

  // Update payment status to refunded
  await supabaseAdmin
    .from('payments')
    .update({
      status: 'refunded',
      metadata: {
        ...payment.metadata,
        refund_id: refundEntity.id,
        refund_amount: refundEntity.amount,
        refund_status: refundEntity.status,
      },
    })
    .eq('id', payment.id);

  // Deduct the credits if refunded (simplified - in production you'd want more logic)
  // This is a safeguard - typically manual intervention would be needed
  await supabaseAdmin
    .from('users')
    .update({
      credits: supabaseAdmin.raw(`credits - ${payment.credits_purchased}`),
    })
    .eq('id', payment.user_id)
    .gte('credits', payment.credits_purchased);

  // Log refund
  await logPaymentEvent(
    payment.user_id,
    AUDIT_ACTIONS.PAYMENT_REFUNDED,
    payment.id,
    LOG_STATUS.SUCCESS,
    {
      refund_id: refundEntity.id,
      refund_amount: refundEntity.amount,
      credits_deducted: payment.credits_purchased,
    },
    ipAddress,
    userAgent
  );

  console.log(`Webhook: Refund processed: ${paymentId}`);
}
