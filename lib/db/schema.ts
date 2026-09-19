import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, timestamp as pgTimestamp, varchar as pgVarchar } from 'drizzle-orm/pg-core';

// ==========================================
// 1. SQLite Schema (Default for local dev)
// ==========================================
export const usersSqlite = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const subscriptionsSqlite = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull().default('free'),
  status: text('status').notNull().default('active'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodEnd: integer('current_period_end'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const activityLogsSqlite = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  details: text('details'),
  createdAt: integer('created_at').notNull(),
});

export const apiKeysSqlite = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull(),
  prefix: text('prefix').notNull(),
  createdAt: integer('created_at').notNull(),
  lastUsedAt: integer('last_used_at'),
});

export const organizationsSqlite = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const membershipsSqlite = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizationsSqlite.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => usersSqlite.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: integer('created_at').notNull(),
});

export const organizationInvitationsSqlite = sqliteTable('organization_invitations', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizationsSqlite.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

// ==========================================
// 2. PostgreSQL Schema (Neon / Production)
// ==========================================
export const usersPg = pgTable('users', {
  id: pgText('id').primaryKey(),
  name: pgVarchar('name', { length: 255 }),
  email: pgVarchar('email', { length: 255 }).notNull().unique(),
  passwordHash: pgText('password_hash').notNull(),
  role: pgVarchar('role', { length: 50 }).notNull().default('user'),
  avatarUrl: pgText('avatar_url'),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: pgTimestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const subscriptionsPg = pgTable('subscriptions', {
  id: pgText('id').primaryKey(),
  userId: pgText('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
  planId: pgVarchar('plan_id', { length: 50 }).notNull().default('free'),
  status: pgVarchar('status', { length: 50 }).notNull().default('active'),
  stripeCustomerId: pgText('stripe_customer_id'),
  stripeSubscriptionId: pgText('stripe_subscription_id'),
  currentPeriodEnd: pgTimestamp('current_period_end', { mode: 'date' }),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: pgTimestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const activityLogsPg = pgTable('activity_logs', {
  id: pgText('id').primaryKey(),
  userId: pgText('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
  action: pgVarchar('action', { length: 255 }).notNull(),
  details: pgText('details'),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const apiKeysPg = pgTable('api_keys', {
  id: pgText('id').primaryKey(),
  userId: pgText('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
  name: pgVarchar('name', { length: 255 }).notNull(),
  keyHash: pgText('key_hash').notNull(),
  prefix: pgVarchar('prefix', { length: 16 }).notNull(),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  lastUsedAt: pgTimestamp('last_used_at', { mode: 'date' }),
});

export const organizationsPg = pgTable('organizations', {
  id: pgText('id').primaryKey(),
  name: pgVarchar('name', { length: 255 }).notNull(),
  slug: pgVarchar('slug', { length: 255 }).notNull().unique(),
  logoUrl: pgText('logo_url'),
  plan: pgVarchar('plan', { length: 50 }).notNull().default('free'),
  stripeCustomerId: pgText('stripe_customer_id'),
  stripeSubscriptionId: pgText('stripe_subscription_id'),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: pgTimestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const membershipsPg = pgTable('memberships', {
  id: pgText('id').primaryKey(),
  organizationId: pgText('organization_id').notNull().references(() => organizationsPg.id, { onDelete: 'cascade' }),
  userId: pgText('user_id').notNull().references(() => usersPg.id, { onDelete: 'cascade' }),
  role: pgVarchar('role', { length: 50 }).notNull().default('member'),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const organizationInvitationsPg = pgTable('organization_invitations', {
  id: pgText('id').primaryKey(),
  organizationId: pgText('organization_id').notNull().references(() => organizationsPg.id, { onDelete: 'cascade' }),
  email: pgVarchar('email', { length: 255 }).notNull(),
  role: pgVarchar('role', { length: 50 }).notNull().default('member'),
  token: pgText('token').notNull().unique(),
  expiresAt: pgTimestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: pgTimestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Canonical aliases defaulting to the active schema
export const users = usersSqlite;
export const subscriptions = subscriptionsSqlite;
export const activityLogs = activityLogsSqlite;
export const apiKeys = apiKeysSqlite;
export const organizations = organizationsSqlite;
export const memberships = membershipsSqlite;
export const organizationInvitations = organizationInvitationsSqlite;
