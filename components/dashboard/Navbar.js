'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import CreditDisplay from './CreditDisplay';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-gray-900">AI Image Studio</h1>
            <div className="hidden md:flex gap-4">
              <button
                onClick={() => router.push('/generate')}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CreditDisplay />
            {session?.user && (
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700 hidden md:block">
                  {session.user.name}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
