'use client';

import Link from 'next/link';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary component for graceful error recovery.
 * Used in error.tsx files to display user-friendly error messages.
 */
export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Error icon */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>

      {/* Error heading */}
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Something went wrong
      </h2>

      {/* Error message */}
      {error.message && (
        <p className="text-sm text-slate-600 mb-6 max-w-md text-center">
          {error.message.length > 150
            ? `${error.message.substring(0, 150)}...`
            : error.message}
        </p>
      )}

      {/* Error digest for debugging */}
      {error.digest && (
        <p className="text-xs text-slate-400 mb-6">
          Error ID: {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Try again
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
