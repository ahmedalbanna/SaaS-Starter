import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isStripeConfigured, getStripe } from '@/lib/stripe';
import { getSubscriptionByUserId } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!isStripeConfigured()) {
      return NextResponse.json({
        mode: 'stub',
        message: 'Stripe Customer Portal stub: STRIPE_SECRET_KEY is not set. In production, this redirects to the Stripe hosted billing portal.',
        redirectUrl: `${origin}/app/billing?portal_stub=true`,
      });
    }

    const sub = await getSubscriptionByUserId(session.user.id);
    if (!sub?.stripeCustomerId) {
      return NextResponse.json({ error: 'No active Stripe customer found for this account.' }, { status: 400 });
    }

    const stripe = getStripe()!;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/app/billing`,
    });

    return NextResponse.json({
      mode: 'live',
      url: portalSession.url,
    });
  } catch (error: any) {
    console.error('[stripe-portal] Error opening billing portal:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to open customer billing portal' },
      { status: 500 }
    );
  }
}
