'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Something went wrong</h2>
      <p className="mt-2 text-sm text-neutral-600 max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={() => reset()} size="sm" className="mt-6 bg-neutral-900 text-white">
        Try again
      </Button>
    </div>
  );
}
