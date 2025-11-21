'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/dashboard/Navbar';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';

const CREDITS_PER_DOLLAR = 100;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 9999;

// Popular packages for quick selection
const POPULAR_PACKAGES = [
  { amount: 5, credits: 500, popular: false },
  { amount: 10, credits: 1000, popular: true },
  { amount: 25, credits: 2500, popular: false },
  { amount: 50, credits: 5000, popular: false },
  { amount: 100, credits: 10000, popular: false },
];

export default function BuyCreditsPage() {
  const { user, profile, refreshProfile, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [amount, setAmount] = useState(10);
  const [credits, setCredits] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/buy-credits');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('/api/payments/history?limit=10');
      const data = await response.json();

      if (response.ok) {
        setPaymentHistory(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentHistory();
    }
  }, [isAuthenticated, fetchPaymentHistory]);

  // Update credits when amount changes
  useEffect(() => {
    const calculatedCredits = Math.floor(amount * CREDITS_PER_DOLLAR);
    setCredits(calculatedCredits);
  }, [amount]);

  const handleAmountChange = (e) => {
    const value = e.target.value;

    // Allow empty input for typing
    if (value === '') {
      setAmount('');
      setCredits(0);
      return;
    }

    const numValue = parseFloat(value);

    if (!isNaN(numValue)) {
      setAmount(numValue);
    }
  };

  const selectPackage = (packageAmount) => {
    setAmount(packageAmount);
    setError(null);
  };

  const handleBuyCredits = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Validate amount
      if (!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        setError(`Amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}`);
        return;
      }

      setLoading(true);

      // Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amountUsd: parseFloat(amount) }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amountInr * 100, // Amount in paise
        currency: 'INR',
        name: 'AI Image Studio',
        description: `Purchase ${orderData.credits} Credits`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefill?.name || '',
          email: orderData.prefill?.email || '',
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async function (response) {
          // Verify payment
          await verifyPayment(response);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  const verifyPayment = async (razorpayResponse) => {
    try {
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      setSuccess(`Successfully purchased ${verifyData.creditsAdded} credits! Your new balance is ${verifyData.totalCredits} credits.`);

      // Refresh user profile to update credits
      await refreshProfile();

      // Refresh payment history
      await fetchPaymentHistory();
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.message || 'Payment verification failed. Please contact support if credits were not added.');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buy Credits</h1>
          <p className="text-gray-600 mt-1">
            Purchase credits to generate more AI images
          </p>
        </div>

        {/* Current Balance */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-indigo-100 text-sm">Current Balance</p>
              <p className="text-4xl font-bold">{profile?.credits || 0}</p>
              <p className="text-indigo-100 text-sm">credits</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-100 text-sm">Rate</p>
              <p className="text-xl font-semibold">$1 = 100 credits</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Purchase Form */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>
                Enter an amount or select a package
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm mb-4">
                  {success}
                </div>
              )}

              {/* Popular Packages */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POPULAR_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.amount}
                      onClick={() => selectPackage(pkg.amount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        amount === pkg.amount
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      } ${pkg.popular ? 'ring-2 ring-indigo-200' : ''}`}
                    >
                      <div className="font-semibold text-gray-900">${pkg.amount}</div>
                      <div className="text-sm text-gray-500">{pkg.credits} credits</div>
                      {pkg.popular && (
                        <div className="text-xs text-indigo-600 font-medium mt-1">Popular</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min={MIN_AMOUNT}
                    max={MAX_AMOUNT}
                    step="1"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter amount"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Min: ${MIN_AMOUNT}, Max: ${MAX_AMOUNT}
                </p>
              </div>

              {/* Credits Calculator */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">You will receive:</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {credits.toLocaleString()} credits
                  </span>
                </div>
              </div>

              {/* Buy Button */}
              <Button
                onClick={handleBuyCredits}
                disabled={loading || !amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Buy ${credits.toLocaleString()} Credits for $${amount || 0}`
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Payments are processed securely via Razorpay.
                <br />
                Supports UPI, Credit/Debit Cards (Domestic & International)
              </p>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                Your recent credit purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <p>No purchases yet</p>
                  <p className="text-sm">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.credits_purchased?.toLocaleString()} credits
                          </div>
                          <div className="text-sm text-gray-500">
                            ${payment.amount_usd}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {payment.created_at &&
                          formatDistanceToNow(new Date(payment.created_at), {
                            addSuffix: true,
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
