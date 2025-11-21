import { cn } from '@/utils/cn';

export default function Input({ className, error, ...props }) {
  return (
    <div className="w-full">
      <input
        className={cn(
          'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
