'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PRICING_PLANS, PricingPlan } from '@/lib/stripe';
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Zap,
  Info,
  ExternalLink,
  Loader2,
} from 'lucide-react';

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [interval, setInterval] = React.useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  
  const isUrlStub = (searchParams.get('checkout_result') === 'success' || searchParams.get('stub') === 'true') && Boolean(searchParams.get('plan'));
  const urlStubPlan = searchParams.get('plan')?.toUpperCase() || 'PRO';
  
  const [customStubNotice, setCustomStubNotice] = React.useState<{
    show: boolean;
    planName: string;
    message: string;
  } | null>(null);
  const [isDismissed, setIsDismissed] = React.useState(false);

  const stubNotice = isDismissed
    ? null
    : customStubNotice ||
      (isUrlStub
        ? {
            show: true,
            planName: urlStubPlan,
            message: 'Your plan change was simulated and recorded in your local Drizzle database.',
          }
        : null);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      if (!session) {
        router.push('/register');
      } else {
        router.push('/app');
      }
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          interval,
        }),
      });

      const data = await res.json();

      if (data.mode === 'stub') {
        setIsDismissed(false);
        setCustomStubNotice({
          show: true,
          planName: plan.name,
          message: data.message,
        });
        setLoadingPlan(null);
        return;
      }

      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      if (data.error) {
        alert(data.error);
        setLoadingPlan(null);
      }
    } catch (err: any) {
      alert('Failed to initiate checkout: ' + (err?.message || 'Unknown error'));
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 text-neutral-900 pb-20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>SaaS Starter</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Overview
            </Link>
            <Link href="/pricing" className="text-neutral-900 font-semibold">
              Pricing
            </Link>
            <Link href="/app" className="hover:text-neutral-900 transition-colors">
              Dashboard Shell
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Button asChild size="sm" className="font-medium">
                <Link href="/app">
                  Go to App
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="text-xs font-medium">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Stub Modal Alert when Stripe keys are unset */}
      {stubNotice?.show && (
        <div className="mx-auto mt-6 max-w-3xl px-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-xs text-amber-900">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-amber-950">
                    Stripe Checkout Dev Stub Active ({stubNotice.planName} Plan)
                  </h4>
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="text-amber-700 hover:text-amber-950 font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {stubNotice.message} Since <code>STRIPE_SECRET_KEY</code> is not configured in your environment, this starter automatically simulated the checkout and provisioned the plan in Drizzle ORM!
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="default" className="text-xs h-7 bg-amber-900 hover:bg-amber-950 text-white">
                    <Link href="/app/billing">View Subscription in Dashboard</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={() => setIsDismissed(true)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="pt-16 pb-12 text-center px-4">
        <div className="mx-auto max-w-3xl space-y-4">
          <Badge variant="secondary" className="px-3 py-1 font-medium text-xs">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            Predictable pricing for projects of every scale
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
            Choose the right tier for your product. Start free in development, switch database drivers anytime, and integrate live Stripe payments in minutes.
          </p>

          {/* Billing Interval Toggle */}
          <div className="pt-6 flex justify-center items-center gap-3">
            <span className={`text-xs font-medium ${interval === 'monthly' ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>
              Monthly billing
            </span>
            <button
              type="button"
              onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-neutral-200 transition-colors duration-200 ease-in-out focus:outline-none dark:bg-neutral-800"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  interval === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-medium ${interval === 'yearly' ? 'text-neutral-900 font-semibold' : 'text-neutral-500'}`}>
                Annual billing
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                Save 20%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const price = interval === 'yearly' ? plan.priceAnnual : plan.priceMonthly;
            const isPopular = plan.isPopular;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between transition-all duration-200 ${
                  isPopular
                    ? 'border-neutral-900 shadow-md ring-1 ring-neutral-900'
                    : 'border-neutral-200 shadow-xs hover:border-neutral-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white shadow-xs">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-xs mt-1 min-h-[36px]">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight">
                        ${price}
                      </span>
                      <span className="text-xs font-medium text-neutral-500">
                        / month {interval === 'yearly' && plan.priceMonthly > 0 ? '(billed annually)' : ''}
                      </span>
                    </div>

                    <div className="h-px bg-neutral-100 w-full" />

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        What&apos;s included
                      </p>
                      <ul className="space-y-2.5 text-xs text-neutral-600">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            {feature.included ? (
                              <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                            ) : (
                              <X className="h-4 w-4 shrink-0 text-neutral-300 mt-0.5" />
                            )}
                            <span className={feature.included ? 'text-neutral-700' : 'text-neutral-400'}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-6">
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loadingPlan === plan.id}
                    variant={isPopular ? 'default' : 'outline'}
                    className={`w-full font-medium ${isPopular ? 'bg-neutral-900 hover:bg-neutral-800' : ''}`}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stripe & Drizzle Technical Callout */}
      <section className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Production Architecture</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Stripe Subscriptions + Drizzle ORM Data Layer
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                This starter ships with clean webhooks, customers portal session generation, and dual-dialect support. When <code>STRIPE_SECRET_KEY</code> is unset, an interactive stub allows full UI testing without external sandbox setups.
              </p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-4 text-xs font-mono text-neutral-200 space-y-1">
              <div className="text-neutral-400">{'// In .env to go live:'}</div>
              <div>STRIPE_SECRET_KEY=&quot;sk_live_...&quot;</div>
              <div>STRIPE_WEBHOOK_SECRET=&quot;whsec_...&quot;</div>
              <div className="text-emerald-400 mt-2">{'// Drizzle switch to Neon:'}</div>
              <div>DATABASE_DRIVER=&quot;postgres&quot;</div>
              <div>DATABASE_URL=&quot;postgresql://...&quot;</div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="mx-auto mt-20 max-w-4xl px-4 sm:px-6">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-500">
            Everything you need to know about the starter subscription engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900">
              How does the Stripe Checkout stub work?
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              When Stripe API keys are not supplied in <code>.env</code>, the checkout endpoint automatically triggers stub mode. It provisions the requested subscription tier directly in Drizzle ORM and redirects you into the dashboard, enabling zero-friction local testing.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900">
              Can I switch between SQLite and Neon Postgres?
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Yes. By setting <code>DATABASE_DRIVER=&quot;postgres&quot;</code> and providing a Neon connection string, the query layer routes to <code>@neondatabase/serverless</code> without changing any application code.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900">
              How are user passwords secured?
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Passwords are salted and hashed using <code>bcryptjs</code> with 10 rounds prior to database insertion. Sessions use secure HTTP-only JWTs managed by Auth.js (NextAuth v5).
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-2">
            <h4 className="text-sm font-semibold text-neutral-900">
              Is customer portal management included?
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Yes. The <code>/api/stripe/portal</code> endpoint creates hosted customer billing portal sessions so subscribers can self-manage credit cards, invoices, and cancellations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <PricingContent />
    </React.Suspense>
  );
}

