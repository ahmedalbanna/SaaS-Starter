import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <h2 className="text-4xl font-extrabold text-neutral-900 tracking-tight">404</h2>
      <p className="mt-2 text-sm text-neutral-600">This page could not be found.</p>
      <Button asChild size="sm" className="mt-6 bg-neutral-900 text-white">
        <Link href="/app">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
