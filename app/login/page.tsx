'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, ArrowRight, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/app';
  const registered = searchParams.get('registered') === 'true';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [quickLoading, setQuickLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAction(email, password, callbackUrl);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        return;
      }
      try {
        const res = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (res?.error) {
          setError('Invalid email or password. Please check your credentials.');
          setLoading(false);
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      } catch (clientErr: any) {
        setError(clientErr?.message || 'Authentication failed. Please try again.');
        setLoading(false);
      }
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setQuickLoading(true);
    setEmail('demo@saas-starter.dev');
    setPassword('password123');

    try {
      const res = await loginAction('demo@saas-starter.dev', 'password123', callbackUrl);
      if (res?.error) {
        setError(res.error);
        setQuickLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        return;
      }
      try {
        const res = await signIn('credentials', {
          email: 'demo@saas-starter.dev',
          password: 'password123',
          redirect: false,
        });

        if (res?.error) {
          setError('Demo user not found. Run `npm run db:seed` or register a new account below.');
          setQuickLoading(false);
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      } catch (clientErr: any) {
        setError('Failed to sign in with demo credentials.');
        setQuickLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-neutral-50/80">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>SaaS Starter</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Welcome back</h1>
          <p className="text-sm text-neutral-500">
            Sign in to access your dashboard shell and subscription
          </p>
        </div>

        {/* Quick Demo Login Preset Banner */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Dev Sandbox Preset</span>
              </div>
              <p className="text-xs text-neutral-500">
                Sign in instantly as pre-configured Admin (Pro Plan)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={quickLoading || loading}
              onClick={handleDemoLogin}
              className="text-xs shrink-0 font-medium"
            >
              {quickLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                '1-Click Demo'
              )}
            </Button>
          </div>
        </div>

        {registered && (
          <div className="p-3.5 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            Account created successfully! Please sign in with your credentials.
          </div>
        )}

        {error && (
          <div className="p-3.5 text-xs rounded-lg bg-red-50 border border-red-200 text-red-800">
            {error}
          </div>
        )}

        {/* Login Form Card */}
        <Card className="shadow-xs border-neutral-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Sign in with social provider or email credentials
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social OAuth Providers */}
            <SocialAuthButtons callbackUrl={callbackUrl} />

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-2 text-neutral-400 font-medium">Or email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700" htmlFor="email">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || quickLoading}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700" htmlFor="password">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || quickLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full font-medium mt-2"
                disabled={loading || quickLoading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-neutral-500">
          Don&apos;t have an account yet?{' '}
          <Link
            href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-neutral-700"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}

