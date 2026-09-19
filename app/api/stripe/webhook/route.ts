import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { upsertSubscription, logActivity } from '@/lib/db';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ received: true, note: 'Stripe or webhook secret not configured, skipped verification' });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  try {
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId || 'pro';
        if (userId) {
          await upsertSubscription({
            userId,
            planId,
            status: 'active',
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          });
          await logActivity(userId, 'subscription_activated', `Subscribed to ${planId.toUpperCase()} plan`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const status = sub.status;
        console.log(`[stripe-webhook] Subscription updated: ${sub.id} -> ${status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        console.log(`[stripe-webhook] Subscription deleted: ${sub.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[stripe-webhook] Error processing event:', err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }
}
