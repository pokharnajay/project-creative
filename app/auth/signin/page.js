'use client';

import { Suspense } from 'react';
import SignInContent from './SignInContent';

function SignInFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900"></div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}
