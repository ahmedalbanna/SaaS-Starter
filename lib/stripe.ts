import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'));
}

export function getStripe(): Stripe | null {
  if (!isStripeConfigured()) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return stripeClient;
}

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  badge?: string;
  isPopular?: boolean;
  buttonText: string;
  features: PlanFeature[];
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'Essential toolkit for solo founders and experimental side projects.',
    priceMonthly: 0,
    priceAnnual: 0,
    buttonText: 'Get Started Free',
    features: [
      { text: 'Up to 3 active projects', included: true },
      { text: '1,000 API requests / month', included: true },
      { text: 'Standard SQLite dev persistence', included: true },
      { text: 'Community Discord support', included: true },
      { text: 'Custom domains', included: false },
      { text: 'Team member seats', included: false },
      { text: 'Audit logging & compliance', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Everything growing teams need to launch, scale, and monetize faster.',
    priceMonthly: 29,
    priceAnnual: 24, // $288 billed annually ($24/mo)
    badge: 'Most Popular',
    isPopular: true,
    buttonText: 'Start 14-Day Free Trial',
    features: [
      { text: 'Unlimited active projects', included: true },
      { text: '250,000 API requests / month', included: true },
      { text: 'Serverless Neon Postgres support', included: true },
      { text: 'Up to 5 team workspace seats', included: true },
      { text: 'Custom domains & SSL certificates', included: true },
      { text: 'Priority email & chat support', included: true },
      { text: 'Detailed usage & latency analytics', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'High-security multi-tenant architecture with bespoke SLAs and governance.',
    priceMonthly: 99,
    priceAnnual: 79, // $948 billed annually ($79/mo)
    badge: 'Scale',
    buttonText: 'Upgrade to Enterprise',
    features: [
      { text: 'Unlimited workspaces & seats', included: true },
      { text: 'Unlimited high-throughput API calls', included: true },
      { text: 'Dedicated isolated database instances', included: true },
      { text: 'SAML / SSO & advanced RBAC', included: true },
      { text: '99.99% uptime SLA guarantee', included: true },
      { text: 'SOC2 Type II compliance reports', included: true },
      { text: 'Dedicated solutions engineer', included: true },
    ],
  },
];
