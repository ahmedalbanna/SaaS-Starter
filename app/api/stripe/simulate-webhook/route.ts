import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { upsertSubscription, logActivity, getSubscriptionByUserId } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const eventType = body.eventType || 'checkout.session.completed';
  const targetPlan = body.planId || 'pro';
  const userId = session.user.id;

  const currentSub = await getSubscriptionByUserId(userId);
  const now = Date.now();
  const simulatedSubId = currentSub?.stripeSubscriptionId || `sub_sim_${Date.now()}`;
  const simulatedCustomerId = currentSub?.stripeCustomerId || `cus_sim_${Date.now()}`;

  switch (eventType) {
    case 'checkout.session.completed': {
      await upsertSubscription({
        userId,
        stripeCustomerId: simulatedCustomerId,
        stripeSubscriptionId: simulatedSubId,
        planId: targetPlan,
        status: 'active',
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      });
      await logActivity(
        userId,
        'stripe_webhook_simulated',
        `Simulated checkout.session.completed for ${targetPlan.toUpperCase()} plan`
      );
      return NextResponse.json({
        success: true,
        eventType,
        planId: targetPlan,
        message: `Successfully processed simulated checkout.session.completed. User is now on the ${targetPlan.toUpperCase()} tier.`,
      });
    }

    case 'customer.subscription.updated': {
      await upsertSubscription({
        userId,
        stripeCustomerId: simulatedCustomerId,
        stripeSubscriptionId: simulatedSubId,
        planId: targetPlan,
        status: 'active',
        currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      });
      await logActivity(
        userId,
        'stripe_webhook_simulated',
        `Simulated customer.subscription.updated to ${targetPlan.toUpperCase()}`
      );
      return NextResponse.json({
        success: true,
        eventType,
        planId: targetPlan,
        message: `Subscription updated to ${targetPlan.toUpperCase()} tier.`,
      });
    }

    case 'customer.subscription.deleted': {
      await upsertSubscription({
        userId,
        planId: 'free',
        status: 'canceled',
      });
      await logActivity(
        userId,
        'stripe_webhook_simulated',
        'Simulated customer.subscription.deleted: downgraded to free tier'
      );
      return NextResponse.json({
        success: true,
        eventType,
        planId: 'free',
        message: 'Subscription canceled. User downgraded to Free tier.',
      });
    }

    case 'invoice.payment_succeeded': {
      await logActivity(
        userId,
        'stripe_webhook_simulated',
        `Simulated invoice.payment_succeeded: $29.00 renewal processed`
      );
      return NextResponse.json({
        success: true,
        eventType,
        message: 'Simulated invoice payment recorded in activity logs.',
      });
    }

    default:
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
  }
}
