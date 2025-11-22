'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

export default function SignInContent() {
  const { signInWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'auth_error') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await signInWithGoogle();

      if (!result.success) {
        setError(result.error || 'Failed to sign in with Google');
        setLoading(false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-sm w-full">
          <div className="mb-10">
            <h1
              className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer"
              onClick={() => router.push('/')}
            >
              AI ImageGen
            </h1>
            <p className="text-gray-500">
              Sign in to create stunning AI-generated product images
            </p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-3 border-gray-300 hover:bg-gray-50"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-4">What you get:</p>
            <div className="space-y-3">
              {[
                'AI-powered product image generation',
                'Combine products with professional models',
                'Organize images in custom folders',
                '100 free credits to start',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gray-50 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-gray-900 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Transform Your Product Photography
          </h2>
          <p className="text-gray-500">
            Create professional advertising images with AI. Upload your product, add models, and generate stunning visuals in seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
