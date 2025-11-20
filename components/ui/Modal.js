'use client';

import { useEffect } from 'react';
import { cn } from '@/utils/cn';

export default function Modal({ isOpen, onClose, children, className }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div
          className={cn(
            'relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 z-10',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalHeader({ children, className }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function ModalTitle({ children, className }) {
  return (
    <h2 className={cn('text-xl font-semibold text-gray-900', className)}>
      {children}
    </h2>
  );
}

export function ModalContent({ children, className }) {
  return <div className={cn('', className)}>{children}</div>;
}

export function ModalFooter({ children, className }) {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)}>
      {children}
    </div>
  );
}
