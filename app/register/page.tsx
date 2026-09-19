'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ArrowRight, Loader2, Check } from 'lucide-react';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/app';

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Call Register API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      // 2. Automatically log the newly registered user in!
      try {
        const res = await loginAction(email, password, callbackUrl);
        if (res?.error) {
          router.push('/login?registered=true');
          return;
        }
        router.push(callbackUrl);
        router.refresh();
      } catch (err: any) {
        if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
          return;
        }
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong during registration.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-neutral-50/80">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>SaaS Starter</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Create an account</h1>
          <p className="text-sm text-neutral-500">
            Start your 14-day trial with full access to the dashboard
          </p>
        </div>

        {error && (
          <div className="p-3.5 text-xs rounded-lg bg-red-50 border border-red-200 text-red-800">
            {error}
          </div>
        )}

        <Card className="shadow-xs border-neutral-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign Up</CardTitle>
            <CardDescription className="text-xs">
              Fill in your details or sign up with a provider
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pb-0">
            <SocialAuthButtons callbackUrl={callbackUrl} />

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-2 text-neutral-400 font-medium">Or register with email</span>
              </div>
            </div>
          </CardContent>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700" htmlFor="name">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  required
                  placeholder="Taylor Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700" htmlFor="email">
                  Work Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="taylor@company.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <p className="text-[11px] text-neutral-500">
                  Must be at least 8 characters. Securely hashed via bcrypt.
                </p>
              </div>

              <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 space-y-1 border border-neutral-100">
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Includes free Starter tier forever</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upgrade to Pro or Enterprise anytime</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <RegisterContent />
    </React.Suspense>
  );
}

