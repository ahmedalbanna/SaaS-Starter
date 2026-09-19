import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSubscriptionByUserId } from '@/lib/db';
import { isStripeConfigured, PRICING_PLANS, getPlanLimits } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getSubscriptionByUserId(session.user.id);
    const planId = (subscription?.planId as 'free' | 'pro' | 'enterprise') || 'free';
    const planMeta = PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[0];
    const limits = getPlanLimits(planId);

    return NextResponse.json({
      subscription: subscription || {
        userId: session.user.id,
        planId: 'free',
        status: 'active',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      plan: planMeta,
      limits,
      isStripeConfigured: isStripeConfigured(),
    });
  } catch (error: any) {
    console.error('[api/billing/subscription] Error fetching subscription:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
