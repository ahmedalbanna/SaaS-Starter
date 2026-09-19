'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRICING_PLANS } from '@/lib/stripe';
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  Check,
} from 'lucide-react';

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const queryPlan = searchParams.get('plan') as 'free' | 'pro' | 'enterprise' | null;
  const isCheckoutSuccess = searchParams.get('checkout_result') === 'success';

  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = React.useState<'free' | 'pro' | 'enterprise' | null>(null);
  const [customStubMessage, setCustomStubMessage] = React.useState<string | null>(null);
  const [isDismissed, setIsDismissed] = React.useState(false);

  const currentPlan = selectedPlan || queryPlan || 'pro';
  const stubMessage = isDismissed
    ? null
    : customStubMessage ||
      (isCheckoutSuccess && queryPlan
        ? `Successfully activated ${queryPlan.toUpperCase()} plan (Stripe Dev Stub simulation).`
        : null);

  const handleOpenPortal = async () => {
    setLoadingAction('portal');
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.mode === 'stub') {
        setIsDismissed(false);
        setCustomStubMessage(data.message);
        setLoadingAction(null);
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
        setSelectedPlan(planId);
        setIsDismissed(false);
        setCustomStubMessage(`Upgraded to ${planId.toUpperCase()} plan via dev stub!`);
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

  const activePlanMeta = PRICING_PLANS.find((p) => p.id === currentPlan) || PRICING_PLANS[1];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Subscriptions &amp; Billing
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage your subscription tier, payment methods, and automated invoices.
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
              <Badge variant="default" className="text-xs font-mono uppercase">
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

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Price
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-0.5">
                ${activePlanMeta.priceMonthly} / month
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Renewal Date
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span>In 30 days</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                Payment Integration
              </span>
              <div className="text-lg font-bold text-neutral-900 mt-0.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Stripe Checkout</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans Switcher */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-neutral-900">
          Change Subscription Plan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card
                key={plan.id}
                className={`p-5 flex flex-col justify-between ${
                  isCurrent ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-neutral-900">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold">
                    ${plan.priceMonthly}
                    <span className="text-xs font-normal text-neutral-500"> / mo</span>
                  </div>
                  <p className="text-xs text-neutral-500">{plan.description}</p>
                </div>

                <div className="pt-5">
                  <Button
                    onClick={() => handleSwitchPlan(plan.id)}
                    disabled={isCurrent || loadingAction === plan.id}
                    variant={isCurrent ? 'secondary' : 'default'}
                    size="sm"
                    className="w-full text-xs font-medium"
                  >
                    {loadingAction === plan.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isCurrent ? (
                      'Current Plan'
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
      <BillingContent />
    </React.Suspense>
  );
}

