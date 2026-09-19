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

export type OrganizationRole = 'owner' | 'admin' | 'billing_manager' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: number;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  token: string;
  expiresAt: number;
  createdAt: number;
}

export interface WorkspaceWithRole extends Organization {
  userRole: OrganizationRole;
  membershipId: string;
}

export interface WorkspaceMemberInfo {
  id: string; // membership id
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: OrganizationRole;
  joinedAt: number;
}
