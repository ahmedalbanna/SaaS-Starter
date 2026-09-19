export interface User {
  id: string;
  name: string | null;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  avatarUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
}
