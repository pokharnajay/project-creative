'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const types = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50',
        types[type],
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      <p className="font-medium">{message}</p>
    </div>
  );
}
