import Razorpay from 'razorpay';
import crypto from 'crypto';

// Credits pricing: 100 credits = $1
export const CREDITS_PER_DOLLAR = 100;
export const MIN_PURCHASE_USD = 1;
export const MAX_PURCHASE_USD = 9999;

// Get payment stage from environment
const PAYMENT_STAGE = process.env.PAYMENT_STAGE || 'sandbox';

// Validate payment stage
if (!['sandbox', 'production'].includes(PAYMENT_STAGE)) {
  throw new Error('PAYMENT_STAGE must be either "sandbox" or "production"');
}

// Get Razorpay credentials based on stage
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('Missing Razorpay credentials. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
}

/**
 * Initialize Razorpay instance
 */
export const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/**
 * Calculate credits from USD amount
 */
export function calculateCredits(amountUsd) {
  const amount = parseFloat(amountUsd);

  if (isNaN(amount) || amount < MIN_PURCHASE_USD || amount > MAX_PURCHASE_USD) {
    throw new Error(`Amount must be between $${MIN_PURCHASE_USD} and $${MAX_PURCHASE_USD}`);
  }

  return Math.floor(amount * CREDITS_PER_DOLLAR);
}

/**
 * Calculate USD amount from credits
 */
export function calculateUsdFromCredits(credits) {
  return credits / CREDITS_PER_DOLLAR;
}

/**
 * Convert USD to INR paise (Razorpay uses smallest currency unit)
 * Approximate conversion rate - in production, use a real-time API
 */
export function convertUsdToInrPaise(amountUsd, exchangeRate = 83) {
  const amountInr = amountUsd * exchangeRate;
  return Math.round(amountInr * 100); // Convert to paise
}

/**
 * Create a Razorpay order
 * @param {number} amountUsd - Amount in USD
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Promise<Object>} Order details
 */
export async function createRazorpayOrder(amountUsd, userId, userEmail) {
  try {
    // Validate amount
    const amount = parseFloat(amountUsd);
    if (isNaN(amount) || amount < MIN_PURCHASE_USD || amount > MAX_PURCHASE_USD) {
      throw new Error(`Invalid amount. Must be between $${MIN_PURCHASE_USD} and $${MAX_PURCHASE_USD}`);
    }

    // Calculate credits and INR amount
    const credits = calculateCredits(amount);
    const amountInrPaise = convertUsdToInrPaise(amount);

    // Create order options
    const orderOptions = {
      amount: amountInrPaise, // Amount in paise
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        user_id: userId,
        user_email: userEmail,
        amount_usd: amount.toFixed(2),
        credits: credits.toString(),
        payment_stage: PAYMENT_STAGE,
      },
    };

    // Create order with Razorpay
    const order = await razorpayInstance.orders.create(orderOptions);

    return {
      success: true,
      orderId: order.id,
      amount: amount,
      amountInr: amountInrPaise / 100,
      currency: 'INR',
      credits: credits,
      paymentStage: PAYMENT_STAGE,
      order: order,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify Razorpay payment signature
 * CRITICAL: This prevents payment fraud
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} True if signature is valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  try {
    // Create expected signature
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Verify webhook signature from Razorpay
 * @param {string} body - Raw request body
 * @param {string} signature - Webhook signature from header
 * @param {string} webhookSecret - Webhook secret from Razorpay dashboard
 * @returns {boolean} True if signature is valid
 */
export function verifyWebhookSignature(body, signature, webhookSecret) {
  try {
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
export async function fetchPaymentDetails(paymentId) {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

/**
 * Get payment stage (sandbox or production)
 */
export function getPaymentStage() {
  return PAYMENT_STAGE;
}

/**
 * Check if we're in sandbox mode
 */
export function isSandboxMode() {
  return PAYMENT_STAGE === 'sandbox';
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate payment amount
 */
export function isValidPaymentAmount(amountUsd) {
  const amount = parseFloat(amountUsd);
  return !isNaN(amount) && amount >= MIN_PURCHASE_USD && amount <= MAX_PURCHASE_USD;
}
