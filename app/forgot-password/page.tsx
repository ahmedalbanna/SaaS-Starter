'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

function ForgotPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit request');
        setLoading(false);
        return;
      }

      setSent(true);
      setMessage(data.message);
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-neutral-900">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg">SaaS Starter</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Reset Your Password
          </h1>
          <p className="text-xs text-neutral-500">
            Enter your registered email address and we&apos;ll send you a password reset link.
          </p>
        </div>

        <Card className="shadow-xs border-neutral-200">
          {sent ? (
            <CardContent className="pt-6 pb-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-neutral-900">Check your inbox</h3>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-sm mx-auto">
                  {message}
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 text-[11px] text-neutral-600 border border-neutral-200 text-left space-y-1">
                <span className="font-semibold text-neutral-900">Dev Mode Active:</span>
                <p>
                  Since email is running in Developer Simulator mode, check your server terminal or inspect recent emails via the API.
                </p>
              </div>

              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full text-xs">
                  <Link href="/login">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Return to Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="pl-9 text-xs"
                      disabled={loading}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={loading} className="w-full text-xs font-medium">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending link...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Send Reset Instructions
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Button>

                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/login">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                    Back to Sign In
                  </Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </React.Suspense>
  );
}
