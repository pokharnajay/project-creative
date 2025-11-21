'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CreditDisplay() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    if (session?.user?.credits !== undefined) {
      setCredits(session.user.credits);
    } else {
      fetchCredits();
    }
  }, [session]);

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
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
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
      <span className="font-semibold">{credits} Credits</span>
    </div>
  );
}
