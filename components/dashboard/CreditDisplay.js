'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function CreditDisplay() {
  const { profile, isAuthenticated } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (profile?.credits !== undefined) {
      setCredits(profile.credits);
    } else if (isAuthenticated) {
      fetchCredits();
    }
  }, [profile, isAuthenticated]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits');
      if (!response.ok) throw new Error('Failed to fetch credits');

      const data = await response.json();
      setCredits(data.credits);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  if (credits === null) return null;

  return (
    <button
      onClick={() => router.push('/buy-credits')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all cursor-pointer min-w-[70px] justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-sm font-medium">
        {isHovered ? 'Buy' : credits.toLocaleString()}
      </span>
    </button>
  );
}
