import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSubscriptionByUserId, getOrganizationById } from '@/lib/db';
import { isStripeConfigured, PRICING_PLANS, getPlanLimits } from '@/lib/stripe';
import { cookies } from 'next/headers';
import { ACTIVE_WORKSPACE_COOKIE } from '@/lib/workspace';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

    let orgPlan: 'free' | 'pro' | 'enterprise' | null = null;
    let orgName = '';
    if (activeOrgId) {
      const org = await getOrganizationById(activeOrgId);
      if (org) {
        orgPlan = org.plan;
        orgName = org.name;
      }
    }

    const subscription = await getSubscriptionByUserId(session.user.id);
    const planId = orgPlan || (subscription?.planId as 'free' | 'pro' | 'enterprise') || 'free';
    const planMeta = PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[0];
    const limits = getPlanLimits(planId);

    return NextResponse.json({
      subscription: subscription || {
        userId: session.user.id,
        planId,
        status: 'active',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      plan: planMeta,
      limits,
      workspaceName: orgName || null,
      workspacePlan: orgPlan,
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
