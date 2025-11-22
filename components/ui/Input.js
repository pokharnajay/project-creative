import { cn } from '@/utils/cn';

export default function Input({ className, error, ...props }) {
  return (
    <div className="w-full">
      <input
        className={cn(
          'w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 placeholder-gray-400',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-200 focus:ring-gray-900 focus:border-gray-900',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
