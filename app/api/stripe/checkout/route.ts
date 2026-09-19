import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isStripeConfigured, getStripe, PRICING_PLANS } from '@/lib/stripe';
import { upsertSubscription, logActivity } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => ({}));
    const planId = (body.planId as 'free' | 'pro' | 'enterprise') || 'pro';
    const interval = (body.interval as 'monthly' | 'yearly') || 'monthly';

    const selectedPlan = PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[1];

    // Determine host for redirect URLs
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // ---------------------------------------------------------------
    // 1. Stub Mode: When Stripe keys are unset
    // ---------------------------------------------------------------
    if (!isStripeConfigured()) {
      // If user is authenticated, update database record so dev testing works end-to-end!
      if (session?.user?.id) {
        await upsertSubscription({
          userId: session.user.id,
          planId,
          status: 'active',
          stripeCustomerId: 'cus_stub_test_dev',
          stripeSubscriptionId: `sub_stub_${planId}_${Date.now()}`,
          currentPeriodEnd: Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000,
        });

        await logActivity(
          session.user.id,
          'subscription_switched',
          `[Stub Mode] Upgraded to ${selectedPlan.name} plan (${interval})`
        );
      }

      return NextResponse.json({
        mode: 'stub',
        isStub: true,
        success: true,
        plan: selectedPlan,
        message: 'Stripe API keys are not configured. Switched to interactive dev stub simulation mode.',
        instructions: 'To enable live Stripe checkouts, configure STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment.',
        redirectUrl: `${origin}/app/billing?checkout_result=success&stub=true&plan=${planId}`,
      });
    }

    // ---------------------------------------------------------------
    // 2. Real Stripe Mode: When STRIPE_SECRET_KEY is configured
    // ---------------------------------------------------------------
    const stripe = getStripe()!;
    const unitAmount = interval === 'yearly' 
      ? selectedPlan.priceAnnual * 12 * 100 
      : selectedPlan.priceMonthly * 100;

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPlan.name} Plan`,
              description: selectedPlan.description,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: session?.user?.email || undefined,
      client_reference_id: session?.user?.id || undefined,
      metadata: {
        userId: session?.user?.id || '',
        planId: selectedPlan.id,
      },
      success_url: `${origin}/app/billing?checkout_result=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?checkout_result=cancelled`,
    });

    return NextResponse.json({
      mode: 'live',
      isStub: false,
      url: stripeSession.url,
    });
  } catch (error: any) {
    console.error('[stripe-checkout] Error creating checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to initialize Stripe checkout session' },
      { status: 500 }
    );
  }
}
