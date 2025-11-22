'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import CreditDisplay from './CreditDisplay';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/generate', label: 'Generate' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              ImageGen
            </span>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  pathname === link.href
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

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
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
