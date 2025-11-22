'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import CreditDisplay from './CreditDisplay';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/generate', label: 'Generate' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/buy-credits', label: 'Buy Credits' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-10">
            <h1
              className="text-xl font-bold text-gray-900 cursor-pointer"
              onClick={() => router.push('/')}
            >
              AI ImageGen
            </h1>
            <div className="hidden md:flex gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    pathname === link.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <CreditDisplay />
            {user && (
              <div className="flex items-center gap-3">
                {(profile?.image || user.user_metadata?.avatar_url) && (
                  <img
                    src={profile?.image || user.user_metadata?.avatar_url}
                    alt={profile?.name || user.user_metadata?.name || 'User'}
                    className="w-8 h-8 rounded-full border border-gray-200"
                  />
                )}
                <span className="text-sm text-gray-700 hidden lg:block font-medium">
                  {profile?.name || user.user_metadata?.name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600"
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
