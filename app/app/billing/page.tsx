'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRICING_PLANS, PricingPlan, PlanLimits } from '@/lib/stripe';
import {
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Calendar,
  Check,
  Zap,
  Users,
  Activity,
  Database,
  Layers,
} from 'lucide-react';

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const isCheckoutSuccess = searchParams.get('checkout_result') === 'success';
  const queryPlan = searchParams.get('plan') as 'free' | 'pro' | 'enterprise' | null;

  const [loadingData, setLoadingData] = React.useState(true);
  const [subData, setSubData] = React.useState<{
    subscription: any;
    plan: PricingPlan;
    limits: PlanLimits;
    isStripeConfigured: boolean;
  } | null>(null);

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [customStubMessage, setCustomStubMessage] = React.useState<string | null>(null);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Fetch subscription from database on mount
  const fetchSubscription = React.useCallback(async () => {
    try {
      const res = await fetch('/api/billing/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubData(data);
      }
    } catch (err) {
      console.error('Failed to load subscription status', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    fetch('/api/billing/subscription')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setSubData(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load subscription status', err);
      })
      .finally(() => {
        if (active) {
          setLoadingData(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stubMessage = isDismissed
    ? null
    : customStubMessage ||
      (isCheckoutSuccess && queryPlan
        ? `Successfully activated ${queryPlan.toUpperCase()} plan!`
        : null);

  const handleOpenPortal = async () => {
    setLoadingAction('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.mode === 'stub') {
        setIsDismissed(false);
        setCustomStubMessage(data.message);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      alert(data.error || 'Failed to open portal');
    } catch (err: any) {
      alert('Error opening billing portal');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSwitchPlan = async (planId: 'free' | 'pro' | 'enterprise') => {
    setLoadingAction(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval: 'monthly' }),
      });
      const data = await res.json();
      if (data.mode === 'stub') {
        setIsDismissed(false);
        setCustomStubMessage(`Switched to ${planId.toUpperCase()} plan! (Persisted in database)`);
        await fetchSubscription();
        router.refresh();
      } else if (data.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      alert('Failed to switch plan');
    } finally {
      setLoadingAction(null);
    }
  };

  if (loadingData) {
    return (
      <div className="py-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const currentPlanId = subData?.subscription?.planId || 'free';
  const activePlanMeta = PRICING_PLANS.find((p) => p.id === currentPlanId) || PRICING_PLANS[0];
  const limits = subData?.limits || activePlanMeta.limits;

  // Mocked simulated usage metrics for demonstration
  const apiUsagePercent = limits.apiRequests === -1 ? 12 : Math.min(100, Math.round((1420 / limits.apiRequests) * 100));
  const teamSeatsPercent = limits.teamSeats === -1 ? 25 : Math.min(100, Math.round((2 / limits.teamSeats) * 100));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Subscriptions &amp; Billing
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your subscription tier, billing preferences, and feature limits.
        </p>
      </div>

      {stubMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">{stubMessage}</p>
            <p className="text-emerald-700">
              Your account status is persisted in the Drizzle ORM database.
            </p>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-emerald-700 font-bold hover:text-emerald-950"
          >
            ×
          </button>
        </div>
      )}

      {/* Current Plan Overview Card */}
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">
                {activePlanMeta.name} Plan
              </CardTitle>
              <Badge variant="default" className="text-xs font-mono uppercase bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                Active
              </Badge>
            </div>
            <CardDescription className="text-xs mt-1">
              {activePlanMeta.description}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenPortal}
              disabled={loadingAction === 'portal'}
              className="text-xs"
            >
              {loadingAction === 'portal' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              )}
              Stripe Customer Portal
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Current Price
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-0.5">
                ${activePlanMeta.priceMonthly} / month
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Renewal Period
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>Next billing cycle in 30 days</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Database Support
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-0.5 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>{limits.databaseSupport}</span>
              </div>
            </div>
          </div>

          {/* Plan Quotas & Usage Meters */}
          <div className="pt-2 border-t border-neutral-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-neutral-700" />
              Resource Limits &amp; Monthly Usage
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* API Requests Usage */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    API Requests
                  </span>
                  <span className="font-mono text-neutral-500">
                    {limits.apiRequests === -1 ? 'Unlimited' : `1,420 / ${limits.apiRequests.toLocaleString()}`}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${apiUsagePercent}%` }}
                  />
                </div>
              </div>

              {/* Team Member Seats */}
              <div className="p-3.5 rounded-lg border border-neutral-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Team Seats
                  </span>
                  <span className="font-mono text-neutral-500">
                    {limits.teamSeats === -1 ? 'Unlimited' : `2 / ${limits.teamSeats}`}
                  </span>
                </div>
                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${teamSeatsPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans Switcher */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900">
            Available Subscription Tiers
          </h3>
          <p className="text-xs text-neutral-500">
            Upgrade or switch tiers anytime. Pro and Enterprise include expanded database capabilities and higher rate limits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <Card
                key={plan.id}
                className={`p-5 flex flex-col justify-between transition-all duration-150 ${
                  isCurrent ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-xs' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-neutral-900">{plan.name}</h4>
                    {isCurrent ? (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Active Tier
                      </span>
                    ) : (
                      plan.badge && (
                        <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                          {plan.badge}
                        </span>
                      )
                    )}
                  </div>

                  <div className="text-2xl font-extrabold text-neutral-900">
                    ${plan.priceMonthly}
                    <span className="text-xs font-normal text-neutral-500"> / month</span>
                  </div>

                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="pt-2 space-y-2 border-t border-neutral-100">
                    <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      Included Features
                    </p>
                    <ul className="space-y-1.5 text-xs text-neutral-600">
                      {plan.features.slice(0, 4).map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-5">
                  <Button
                    onClick={() => handleSwitchPlan(plan.id)}
                    disabled={isCurrent || loadingAction === plan.id}
                    variant={isCurrent ? 'secondary' : 'default'}
                    size="sm"
                    className={`w-full text-xs font-medium ${!isCurrent ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : ''}`}
                  >
                    {loadingAction === plan.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isCurrent ? (
                      'Current Active Plan'
                    ) : (
                      `Switch to ${plan.name}`
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <PricingContentWrapper />
    </React.Suspense>
  );
}

function PricingContentWrapper() {
  return <BillingContent />;
}


