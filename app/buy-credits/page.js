'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import Navbar from '@/components/dashboard/Navbar';
import { formatDistanceToNow } from 'date-fns';

const CREDITS_PER_DOLLAR = 100;
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 9999;

// Credit packages
const PACKAGES = [
  { amount: 5, credits: 500 },
  { amount: 10, credits: 1000, popular: true },
  { amount: 25, credits: 2500 },
  { amount: 50, credits: 5000 },
  { amount: 100, credits: 10000 },
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin?redirect=/buy-credits');
    }
  }, [authLoading, isAuthenticated, router]);

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

  useEffect(() => {
    const calculatedCredits = Math.floor(amount * CREDITS_PER_DOLLAR);
    setCredits(calculatedCredits);
  }, [amount]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
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

      if (!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        setError(`Amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}`);
        return;
      }

      setLoading(true);

      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: parseFloat(amount) }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amountInr * 100,
        currency: 'INR',
        name: 'AI ImageGen',
        description: `Purchase ${orderData.credits} Credits`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefill?.name || '',
          email: orderData.prefill?.email || '',
        },
        theme: { color: '#18181b' },
        handler: function (response) {
          // Use .then().catch() instead of async/await for better compatibility
          console.log('Razorpay handler called with:', response);
          verifyPayment(response)
            .then(() => {
              console.log('verifyPayment completed successfully');
            })
            .catch((err) => {
              console.error('verifyPayment error in handler:', err);
              setError('Payment verification failed. Please refresh and check your credits.');
              setLoading(false);
            });
        },
        modal: {
          ondismiss: function () {
            console.log('Razorpay modal dismissed');
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
    console.log('verifyPayment called with:', razorpayResponse);
    try {
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
        }),
      });

      console.log('verifyResponse status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('verifyData:', verifyData);

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      const creditsAdded = verifyData.creditsAdded || verifyData.credits || 0;
      console.log('Setting success, creditsAdded:', creditsAdded);
      setSuccess(`Successfully added ${creditsAdded.toLocaleString()} credits to your account.`);

      console.log('Calling refreshProfile...');
      try {
        await refreshProfile();
        console.log('refreshProfile completed');
      } catch (refreshErr) {
        console.error('refreshProfile error:', refreshErr);
      }

      console.log('Calling fetchPaymentHistory...');
      try {
        await fetchPaymentHistory();
        console.log('fetchPaymentHistory completed');
      } catch (historyErr) {
        console.error('fetchPaymentHistory error:', historyErr);
      }

      console.log('All done, setting loading to false');
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.message || 'Payment verification failed. Please contact support.');
    } finally {
      console.log('Finally block, setting loading false');
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Buy Credits</h1>
          <p className="text-gray-500 mt-2">
            Purchase credits to generate AI-powered images
          </p>
        </div>

        {/* Current Balance Card */}
        <div className="border border-gray-200 rounded-xl p-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Current Balance</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">
                {(profile?.credits || 0).toLocaleString()}
                <span className="text-lg font-normal text-gray-500 ml-2">credits</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Exchange Rate</p>
              <p className="text-lg font-medium text-gray-900">$1 = 100 credits</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Purchase Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Amount</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PACKAGES.map((pkg) => (
                  <button
                    key={pkg.amount}
                    onClick={() => selectPackage(pkg.amount)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      amount === pkg.amount
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    <div className="text-xl font-bold text-gray-900">${pkg.amount}</div>
                    <div className="text-sm text-gray-500 mt-1">{pkg.credits.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or enter custom amount
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="1"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                  placeholder="Enter amount"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Minimum: ${MIN_AMOUNT} | Maximum: ${MAX_AMOUNT.toLocaleString()}
              </p>
            </div>

            {/* Summary & Purchase */}
            <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">You will receive</p>
                  <p className="text-3xl font-bold text-gray-900">{credits.toLocaleString()} credits</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${amount || 0}</p>
                </div>
              </div>

              <button
                onClick={handleBuyCredits}
                disabled={loading || !amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT}
                className="w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Purchase Credits
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Secure payment via Razorpay. Supports UPI, Cards & Net Banking.
              </p>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No purchases yet</p>
                  <p className="text-gray-400 text-xs mt-1">Your history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            +{payment.credits_purchased?.toLocaleString()} credits
                          </p>
                          <p className="text-sm text-gray-500">${payment.amount_usd}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusStyle(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {payment.created_at &&
                          formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
