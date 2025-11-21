'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import CreditDisplay from './CreditDisplay';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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
              <button
                onClick={() => router.push('/buy-credits')}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Buy Credits
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CreditDisplay />
            {user && (
              <div className="flex items-center gap-3">
                {(profile?.image || user.user_metadata?.avatar_url) && (
                  <img
                    src={profile?.image || user.user_metadata?.avatar_url}
                    alt={profile?.name || user.user_metadata?.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700 hidden md:block">
                  {profile?.name || user.user_metadata?.name || user.email}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
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
