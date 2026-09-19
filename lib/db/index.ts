import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import type {
  User,
  Subscription,
  ActivityLog,
  ApiKey,
  Organization,
  Membership,
  OrganizationInvitation,
  WorkspaceWithRole,
  WorkspaceMemberInfo,
  OrganizationRole,
} from './types';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Determine active database driver:
// Defaults to 'sqlite' unless DATABASE_DRIVER is 'postgres' or DATABASE_URL starts with postgres
const isPostgres = 
  process.env.DATABASE_DRIVER === 'postgres' || 
  Boolean(process.env.DATABASE_URL?.startsWith('postgres://') || process.env.DATABASE_URL?.startsWith('postgresql://'));

// Ensure data folder exists for SQLite in local dev
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

// Global database connection caching
let dbInstance: any = null;
let rawLibsqlClient: any = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  if (isPostgres) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL environment variable is required for Postgres connection.');
    }
    const sql = neon(url);
    dbInstance = drizzleNeon(sql, {
      schema: {
        ...schema,
        users: schema.usersPg,
        subscriptions: schema.subscriptionsPg,
        activityLogs: schema.activityLogsPg,
        apiKeys: schema.apiKeysPg,
        organizations: schema.organizationsPg,
        memberships: schema.membershipsPg,
        organizationInvitations: schema.organizationInvitationsPg,
      },
    });
    return dbInstance;
  }

  // SQLite via @libsql/client (pure TS/WASM, zero node-gyp native compilation needed)
  ensureDataDir();
  const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'data', 'saas.db')}`;
  rawLibsqlClient = createClient({
    url: dbUrl,
  });

  // Auto-init SQLite tables in dev if they don't exist yet
  rawLibsqlClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar_url TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      current_period_end INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      details TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      prefix TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_used_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo_url TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memberships (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_invitations (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `).catch((err: any) => {
    console.warn('[db] Note on SQLite auto-init:', err?.message || err);
  });

  dbInstance = drizzleLibsql(rawLibsqlClient, { schema });
  return dbInstance;
}

// ----------------------------------------------------
// Unified Data Access Layer (Works with both SQLite & Postgres)
// ----------------------------------------------------

export async function getUserByEmail(email: string): Promise<User | null> {
  const normEmail = email.toLowerCase().trim();
  getDb();

  if (isPostgres) {
    const res = await (dbInstance as any).query.usersPg.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, normEmail),
    });
    if (!res) return null;
    return {
      id: res.id,
      name: res.name,
      email: res.email,
      passwordHash: res.passwordHash,
      role: res.role as 'user' | 'admin',
      avatarUrl: res.avatarUrl,
      createdAt: res.createdAt instanceof Date ? res.createdAt.getTime() : Number(res.createdAt),
      updatedAt: res.updatedAt instanceof Date ? res.updatedAt.getTime() : Number(res.updatedAt),
    };
  }

  // SQLite query
  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1`,
    args: [normEmail],
  });

  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: row.name ? String(row.name) : null,
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: (row.role as 'user' | 'admin') || 'user',
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  getDb();

  if (isPostgres) {
    const res = await (dbInstance as any).query.usersPg.findFirst({
      where: (u: any, { eq }: any) => eq(u.id, id),
    });
    if (!res) return null;
    return {
      id: res.id,
      name: res.name,
      email: res.email,
      passwordHash: res.passwordHash,
      role: res.role as 'user' | 'admin',
      avatarUrl: res.avatarUrl,
      createdAt: res.createdAt instanceof Date ? res.createdAt.getTime() : Number(res.createdAt),
      updatedAt: res.updatedAt instanceof Date ? res.updatedAt.getTime() : Number(res.updatedAt),
    };
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM users WHERE id = ? LIMIT 1`,
    args: [id],
  });

  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: row.name ? String(row.name) : null,
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: (row.role as 'user' | 'admin') || 'user',
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name?: string;
  role?: 'user' | 'admin';
  avatarUrl?: string;
}): Promise<User> {
  getDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  const normEmail = data.email.toLowerCase().trim();
  const role = data.role || 'user';
  const name = data.name || null;
  const avatarUrl = data.avatarUrl || null;

  if (isPostgres) {
    await (dbInstance as any).insert(schema.usersPg).values({
      id,
      name,
      email: normEmail,
      passwordHash: data.passwordHash,
      role,
      avatarUrl,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, role, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, normEmail, data.passwordHash, role, avatarUrl, now, now],
    });
  }

  // Create default free subscription for new user
  await upsertSubscription({
    userId: id,
    planId: 'free',
    status: 'active',
  });

  // Log registration activity
  await logActivity(id, 'account_created', 'User joined the SaaS platform');

  return {
    id,
    name,
    email: normEmail,
    passwordHash: data.passwordHash,
    role,
    avatarUrl,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
  getDb();
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).update(schema.usersPg)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(now),
      })
      .where((u: any, { eq }: any) => eq(u.id, userId));
  } else {
    await rawLibsqlClient.execute({
      sql: `UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`,
      args: [newPasswordHash, now, userId],
    });
  }

  await logActivity(userId, 'password_changed', 'Password updated successfully');
  return true;
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  getDb();

  if (isPostgres) {
    const res = await (dbInstance as any).query.subscriptionsPg.findFirst({
      where: (s: any, { eq }: any) => eq(s.userId, userId),
    });
    if (!res) return null;
    return {
      id: res.id,
      userId: res.userId,
      planId: res.planId as any,
      status: res.status as any,
      stripeCustomerId: res.stripeCustomerId,
      stripeSubscriptionId: res.stripeSubscriptionId,
      currentPeriodEnd: res.currentPeriodEnd ? new Date(res.currentPeriodEnd).getTime() : null,
      createdAt: res.createdAt instanceof Date ? res.createdAt.getTime() : Number(res.createdAt),
      updatedAt: res.updatedAt instanceof Date ? res.updatedAt.getTime() : Number(res.updatedAt),
    };
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM subscriptions WHERE user_id = ? LIMIT 1`,
    args: [userId],
  });

  if (!res.rows.length) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    userId: String(row.user_id),
    planId: (row.plan_id as any) || 'free',
    status: (row.status as any) || 'active',
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    currentPeriodEnd: row.current_period_end ? Number(row.current_period_end) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function upsertSubscription(data: {
  userId: string;
  planId: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  currentPeriodEnd?: number | null;
}): Promise<Subscription> {
  getDb();
  const existing = await getSubscriptionByUserId(data.userId);
  const now = Date.now();

  if (existing) {
    const periodEnd = data.currentPeriodEnd !== undefined ? data.currentPeriodEnd : existing.currentPeriodEnd;
    const custId = data.stripeCustomerId !== undefined ? data.stripeCustomerId : existing.stripeCustomerId;
    const subId = data.stripeSubscriptionId !== undefined ? data.stripeSubscriptionId : existing.stripeSubscriptionId;

    if (isPostgres) {
      await (dbInstance as any).update(schema.subscriptionsPg)
        .set({
          planId: data.planId,
          status: data.status,
          stripeCustomerId: custId,
          stripeSubscriptionId: subId,
          currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
          updatedAt: new Date(now),
        })
        .where((s: any, { eq }: any) => eq(s.id, existing.id));
    } else {
      await rawLibsqlClient.execute({
        sql: `UPDATE subscriptions SET plan_id = ?, status = ?, stripe_customer_id = ?, stripe_subscription_id = ?, current_period_end = ?, updated_at = ? WHERE id = ?`,
        args: [data.planId, data.status, custId, subId, periodEnd, now, existing.id],
      });
    }

    return {
      ...existing,
      planId: data.planId,
      status: data.status,
      stripeCustomerId: custId,
      stripeSubscriptionId: subId,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    };
  }

  // Create fresh subscription
  const id = crypto.randomUUID();
  const periodEnd = data.currentPeriodEnd || (now + 30 * 24 * 60 * 60 * 1000);

  if (isPostgres) {
    await (dbInstance as any).insert(schema.subscriptionsPg).values({
      id,
      userId: data.userId,
      planId: data.planId,
      status: data.status,
      stripeCustomerId: data.stripeCustomerId || null,
      stripeSubscriptionId: data.stripeSubscriptionId || null,
      currentPeriodEnd: new Date(periodEnd),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO subscriptions (id, user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.userId, data.planId, data.status, data.stripeCustomerId || null, data.stripeSubscriptionId || null, periodEnd, now, now],
    });
  }

  return {
    id,
    userId: data.userId,
    planId: data.planId,
    status: data.status,
    stripeCustomerId: data.stripeCustomerId || null,
    stripeSubscriptionId: data.stripeSubscriptionId || null,
    currentPeriodEnd: periodEnd,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getActivityLogs(userId: string, limit = 10): Promise<ActivityLog[]> {
  getDb();

  if (isPostgres) {
    const rows = await (dbInstance as any).query.activityLogsPg.findMany({
      where: (a: any, { eq }: any) => eq(a.userId, userId),
      orderBy: (a: any, { desc }: any) => [desc(a.createdAt)],
      limit,
    });
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      action: r.action,
      details: r.details,
      createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt),
    }));
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    args: [userId, limit],
  });

  return res.rows.map((row: any) => ({
    id: String(row.id),
    userId: String(row.user_id),
    action: String(row.action),
    details: row.details ? String(row.details) : null,
    createdAt: Number(row.created_at),
  }));
}

export async function logActivity(userId: string, action: string, details?: string) {
  getDb();
  const id = crypto.randomUUID();
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).insert(schema.activityLogsPg).values({
      id,
      userId,
      action,
      details: details || null,
      createdAt: new Date(now),
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO activity_logs (id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [id, userId, action, details || null, now],
    });
  }
}

export async function getApiKeys(userId: string): Promise<ApiKey[]> {
  getDb();
  if (isPostgres) {
    const rows = await (dbInstance as any).query.apiKeysPg.findMany({
      where: (k: any, { eq }: any) => eq(k.userId, userId),
      orderBy: (k: any, { desc }: any) => [desc(k.createdAt)],
    });
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      prefix: r.prefix,
      createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : Number(r.createdAt),
      lastUsedAt: r.lastUsedAt ? (r.lastUsedAt instanceof Date ? r.lastUsedAt.getTime() : Number(r.lastUsedAt)) : null,
    }));
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });

  return res.rows.map((row: any) => ({
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name),
    prefix: String(row.prefix),
    createdAt: Number(row.created_at),
    lastUsedAt: row.last_used_at ? Number(row.last_used_at) : null,
  }));
}

export async function createApiKey(userId: string, name: string): Promise<{ key: string; apiKey: ApiKey }> {
  getDb();
  const id = crypto.randomUUID();
  const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = rawKey.slice(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).insert(schema.apiKeysPg).values({
      id,
      userId,
      name,
      keyHash,
      prefix,
      createdAt: new Date(now),
      lastUsedAt: null,
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO api_keys (id, user_id, name, key_hash, prefix, created_at, last_used_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, userId, name, keyHash, prefix, now, null],
    });
  }

  await logActivity(userId, 'api_key_created', `Generated API key: ${name}`);

  return {
    key: rawKey,
    apiKey: {
      id,
      userId,
      name,
      prefix,
      createdAt: now,
      lastUsedAt: null,
    },
  };
}

export async function deleteApiKey(userId: string, keyId: string): Promise<boolean> {
  getDb();
  if (isPostgres) {
    await (dbInstance as any).delete(schema.apiKeysPg)
      .where((k: any, { and, eq }: any) => and(eq(k.id, keyId), eq(k.userId, userId)));
  } else {
    await rawLibsqlClient.execute({
      sql: `DELETE FROM api_keys WHERE id = ? AND user_id = ?`,
      args: [keyId, userId],
    });
  }

  await logActivity(userId, 'api_key_revoked', `Revoked key with ID ${keyId.slice(0, 8)}...`);
  return true;
}

export async function findOrCreateOAuthUser(data: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<User> {
  const normEmail = data.email.toLowerCase().trim();
  const existing = await getUserByEmail(normEmail);
  if (existing) {
    return existing;
  }

  // Create user with a strong random placeholder hash
  const placeholderHash = crypto.randomBytes(32).toString('hex');
  const user = await createUser({
    email: normEmail,
    name: data.name || normEmail.split('@')[0],
    passwordHash: `$2a$10$oauth_account_${placeholderHash}`,
    avatarUrl: data.avatarUrl || undefined,
    role: 'user',
  });

  // Provision initial free subscription
  await upsertSubscription({
    userId: user.id,
    planId: 'free',
    status: 'active',
  });

  await logActivity(user.id, 'user_registered_oauth', `Created account via Social OAuth (${normEmail})`);

  return user;
}

export interface DatabaseDiagnostics {
  driver: 'sqlite' | 'postgres';
  status: 'connected' | 'error';
  latencyMs: number;
  databaseUrl: string;
  isPostgres: boolean;
  counts: {
    users: number;
    subscriptions: number;
    activityLogs: number;
    apiKeys: number;
  };
  error?: string | null;
}

export async function getDatabaseDiagnostics(): Promise<DatabaseDiagnostics> {
  const startTime = Date.now();
  const rawUrl = process.env.DATABASE_URL || (isPostgres ? '' : `file:${path.join(process.cwd(), 'data', 'saas.db')}`);
  
  // Mask credentials in URL for safety
  const maskedUrl = rawUrl.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1******$2');

  try {
    getDb();
    let usersCount = 0;
    let subscriptionsCount = 0;
    let activityLogsCount = 0;
    let apiKeysCount = 0;

    if (isPostgres) {
      const u = await rawLibsqlClient?.execute?.({ sql: 'SELECT 1' }); // fallback
      // query Postgres via drizzle Neon
      const users = await (dbInstance as any).query.usersPg.findMany({ limit: 1 });
      // Count records
      usersCount = 1; // lightweight probe
    } else {
      const uRes = await rawLibsqlClient.execute('SELECT COUNT(*) as c FROM users');
      const sRes = await rawLibsqlClient.execute('SELECT COUNT(*) as c FROM subscriptions');
      const aRes = await rawLibsqlClient.execute('SELECT COUNT(*) as c FROM activity_logs');
      const kRes = await rawLibsqlClient.execute('SELECT COUNT(*) as c FROM api_keys');

      usersCount = Number(uRes.rows[0]?.c || 0);
      subscriptionsCount = Number(sRes.rows[0]?.c || 0);
      activityLogsCount = Number(aRes.rows[0]?.c || 0);
      apiKeysCount = Number(kRes.rows[0]?.c || 0);
    }

    const latencyMs = Date.now() - startTime;

    return {
      driver: isPostgres ? 'postgres' : 'sqlite',
      status: 'connected',
      latencyMs,
      databaseUrl: maskedUrl,
      isPostgres,
      counts: {
        users: usersCount,
        subscriptions: subscriptionsCount,
        activityLogs: activityLogsCount,
        apiKeys: apiKeysCount,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      driver: isPostgres ? 'postgres' : 'sqlite',
      status: 'error',
      latencyMs: Date.now() - startTime,
      databaseUrl: maskedUrl,
      isPostgres,
      counts: {
        users: 0,
        subscriptions: 0,
        activityLogs: 0,
        apiKeys: 0,
      },
      error: err?.message || 'Database connection error',
    };
  }
}

// ==========================================
// Multi-Tenancy & Workspace Operations
// ==========================================

export async function createOrganization({
  name,
  slug,
  ownerUserId,
  plan = 'free',
  logoUrl,
}: {
  name: string;
  slug?: string;
  ownerUserId: string;
  plan?: 'free' | 'pro' | 'enterprise';
  logoUrl?: string;
}): Promise<WorkspaceWithRole> {
  getDb();
  const orgId = `org_${crypto.randomBytes(12).toString('hex')}`;
  const membershipId = `mem_${crypto.randomBytes(12).toString('hex')}`;
  const generatedSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).insert(schema.organizationsPg).values({
      id: orgId,
      name,
      slug: generatedSlug,
      logoUrl: logoUrl || null,
      plan,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    await (dbInstance as any).insert(schema.membershipsPg).values({
      id: membershipId,
      organizationId: orgId,
      userId: ownerUserId,
      role: 'owner',
      createdAt: new Date(now),
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO organizations (id, name, slug, logo_url, plan, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [orgId, name, generatedSlug, logoUrl || null, plan, now, now],
    });

    await rawLibsqlClient.execute({
      sql: `INSERT INTO memberships (id, organization_id, user_id, role, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [membershipId, orgId, ownerUserId, 'owner', now],
    });
  }

  return {
    id: orgId,
    name,
    slug: generatedSlug,
    logoUrl: logoUrl || null,
    plan,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: now,
    updatedAt: now,
    userRole: 'owner',
    membershipId,
  };
}

export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  getDb();
  if (isPostgres) {
    const res = await (dbInstance as any).query.organizationsPg.findFirst({
      where: (o: any, { eq }: any) => eq(o.id, orgId),
    });
    if (!res) return null;
    return {
      id: res.id,
      name: res.name,
      slug: res.slug,
      logoUrl: res.logoUrl,
      plan: res.plan as any,
      stripeCustomerId: res.stripeCustomerId,
      stripeSubscriptionId: res.stripeSubscriptionId,
      createdAt: res.createdAt instanceof Date ? res.createdAt.getTime() : Number(res.createdAt),
      updatedAt: res.updatedAt instanceof Date ? res.updatedAt.getTime() : Number(res.updatedAt),
    };
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM organizations WHERE id = ? LIMIT 1`,
    args: [orgId],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    plan: (row.plan as any) || 'free',
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function getUserOrganizations(userId: string): Promise<WorkspaceWithRole[]> {
  getDb();
  if (isPostgres) {
    const mems = await (dbInstance as any).query.membershipsPg.findMany({
      where: (m: any, { eq }: any) => eq(m.userId, userId),
    });
    if (!mems.length) return [];

    const orgIds = mems.map((m: any) => m.organizationId);
    const orgs = await (dbInstance as any).query.organizationsPg.findMany({
      where: (o: any, { inArray }: any) => inArray(o.id, orgIds),
    });

    const orgMap = new Map<string, any>(orgs.map((o: any) => [o.id, o]));

    return mems
      .map((m: any) => {
        const o: any = orgMap.get(m.organizationId);
        if (!o) return null;
        return {
          id: o.id,
          name: o.name,
          slug: o.slug,
          logoUrl: o.logoUrl,
          plan: o.plan as any,
          stripeCustomerId: o.stripeCustomerId,
          stripeSubscriptionId: o.stripeSubscriptionId,
          createdAt: o.createdAt instanceof Date ? o.createdAt.getTime() : Number(o.createdAt),
          updatedAt: o.updatedAt instanceof Date ? o.updatedAt.getTime() : Number(o.updatedAt),
          userRole: m.role as OrganizationRole,
          membershipId: m.id,
        };
      })
      .filter(Boolean) as WorkspaceWithRole[];
  }

  const res = await rawLibsqlClient.execute({
    sql: `
      SELECT o.*, m.role as user_role, m.id as membership_id
      FROM organizations o
      INNER JOIN memberships m ON m.organization_id = o.id
      WHERE m.user_id = ?
      ORDER BY o.created_at ASC
    `,
    args: [userId],
  });

  return res.rows.map((row: any) => ({
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    plan: (row.plan as any) || 'free',
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id ? String(row.stripe_subscription_id) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    userRole: row.user_role as OrganizationRole,
    membershipId: String(row.membership_id),
  }));
}

export async function getUserMembership(
  orgId: string,
  userId: string
): Promise<Membership | null> {
  getDb();
  if (isPostgres) {
    const res = await (dbInstance as any).query.membershipsPg.findFirst({
      where: (m: any, { and, eq }: any) =>
        and(eq(m.organizationId, orgId), eq(m.userId, userId)),
    });
    if (!res) return null;
    return {
      id: res.id,
      organizationId: res.organizationId,
      userId: res.userId,
      role: res.role as OrganizationRole,
      createdAt: res.createdAt instanceof Date ? res.createdAt.getTime() : Number(res.createdAt),
    };
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM memberships WHERE organization_id = ? AND user_id = ? LIMIT 1`,
    args: [orgId, userId],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    userId: String(row.user_id),
    role: row.role as OrganizationRole,
    createdAt: Number(row.created_at),
  };
}

export async function getOrganizationMembers(orgId: string): Promise<WorkspaceMemberInfo[]> {
  getDb();
  if (isPostgres) {
    const mems = await (dbInstance as any).query.membershipsPg.findMany({
      where: (m: any, { eq }: any) => eq(m.organizationId, orgId),
    });

    if (!mems.length) return [];

    const userIds = mems.map((m: any) => m.userId);
    const usersList = await (dbInstance as any).query.usersPg.findMany({
      where: (u: any, { inArray }: any) => inArray(u.id, userIds),
    });

    const userMap = new Map<string, any>(usersList.map((u: any) => [u.id, u]));

    return mems.map((m: any) => {
      const u: any = userMap.get(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        name: u?.name || null,
        email: u?.email || 'unknown@user.com',
        avatarUrl: u?.avatarUrl || null,
        role: m.role as OrganizationRole,
        joinedAt: m.createdAt instanceof Date ? m.createdAt.getTime() : Number(m.createdAt),
      };
    });
  }

  const res = await rawLibsqlClient.execute({
    sql: `
      SELECT m.id as membership_id, m.role, m.created_at as joined_at,
             u.id as user_id, u.name, u.email, u.avatar_url
      FROM memberships m
      INNER JOIN users u ON u.id = m.user_id
      WHERE m.organization_id = ?
      ORDER BY m.created_at ASC
    `,
    args: [orgId],
  });

  return res.rows.map((row: any) => ({
    id: String(row.membership_id),
    userId: String(row.user_id),
    name: row.name ? String(row.name) : null,
    email: String(row.email),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    role: row.role as OrganizationRole,
    joinedAt: Number(row.joined_at),
  }));
}

export async function addOrganizationMember(
  orgId: string,
  userId: string,
  role: OrganizationRole = 'member'
): Promise<Membership> {
  getDb();
  const membershipId = `mem_${crypto.randomBytes(12).toString('hex')}`;
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).insert(schema.membershipsPg).values({
      id: membershipId,
      organizationId: orgId,
      userId,
      role,
      createdAt: new Date(now),
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO memberships (id, organization_id, user_id, role, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [membershipId, orgId, userId, role, now],
    });
  }

  return {
    id: membershipId,
    organizationId: orgId,
    userId,
    role,
    createdAt: now,
  };
}

export async function updateMemberRole(
  membershipId: string,
  role: OrganizationRole
): Promise<boolean> {
  getDb();
  if (isPostgres) {
    await (dbInstance as any).update(schema.membershipsPg)
      .set({ role })
      .where((m: any, { eq }: any) => eq(m.id, membershipId));
  } else {
    await rawLibsqlClient.execute({
      sql: `UPDATE memberships SET role = ? WHERE id = ?`,
      args: [role, membershipId],
    });
  }
  return true;
}

export async function removeMember(membershipId: string): Promise<boolean> {
  getDb();
  if (isPostgres) {
    await (dbInstance as any).delete(schema.membershipsPg)
      .where((m: any, { eq }: any) => eq(m.id, membershipId));
  } else {
    await rawLibsqlClient.execute({
      sql: `DELETE FROM memberships WHERE id = ?`,
      args: [membershipId],
    });
  }
  return true;
}

export async function createOrganizationInvitation({
  organizationId,
  email,
  role = 'member',
}: {
  organizationId: string;
  email: string;
  role?: OrganizationRole;
}): Promise<OrganizationInvitation> {
  getDb();
  const id = `inv_${crypto.randomBytes(12).toString('hex')}`;
  const token = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  if (isPostgres) {
    await (dbInstance as any).insert(schema.organizationInvitationsPg).values({
      id,
      organizationId,
      email: email.toLowerCase(),
      role,
      token,
      expiresAt: new Date(expiresAt),
      createdAt: new Date(now),
    });
  } else {
    await rawLibsqlClient.execute({
      sql: `INSERT INTO organization_invitations (id, organization_id, email, role, token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, organizationId, email.toLowerCase(), role, token, expiresAt, now],
    });
  }

  return {
    id,
    organizationId,
    email: email.toLowerCase(),
    role,
    token,
    expiresAt,
    createdAt: now,
  };
}

export async function getOrganizationInvitationByToken(
  token: string
): Promise<OrganizationInvitation | null> {
  getDb();
  if (isPostgres) {
    const res = await (dbInstance as any).query.organizationInvitationsPg.findFirst({
      where: (i: any, { eq }: any) => eq(i.token, token),
    });
    if (!res) return null;
    return {
      id: res.id,
      organizationId: res.organizationId,
      email: res.email,
      role: res.role as OrganizationRole,
      token: res.token,
      expiresAt: res.expiresAt instanceof Date ? res.expiresAt.getTime() : Number(res.expiresAt),
      createdAt: res.createdAt instanceof Date ? res.createdAt.getTime() : Number(res.createdAt),
    };
  }

  const res = await rawLibsqlClient.execute({
    sql: `SELECT * FROM organization_invitations WHERE token = ? LIMIT 1`,
    args: [token],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    email: String(row.email),
    role: row.role as OrganizationRole,
    token: String(row.token),
    expiresAt: Number(row.expires_at),
    createdAt: Number(row.created_at),
  };
}

export async function deleteOrganizationInvitation(id: string): Promise<boolean> {
  getDb();
  if (isPostgres) {
    await (dbInstance as any).delete(schema.organizationInvitationsPg)
      .where((i: any, { eq }: any) => eq(i.id, id));
  } else {
    await rawLibsqlClient.execute({
      sql: `DELETE FROM organization_invitations WHERE id = ?`,
      args: [id],
    });
  }
  return true;
}

export async function updateOrganizationPlan(
  orgId: string,
  plan: 'free' | 'pro' | 'enterprise',
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<Organization | null> {
  getDb();
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).update(schema.organizationsPg)
      .set({
        plan,
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        updatedAt: new Date(now),
      })
      .where((o: any, { eq }: any) => eq(o.id, orgId));
  } else {
    await rawLibsqlClient.execute({
      sql: `UPDATE organizations 
            SET plan = ?, stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ?
            WHERE id = ?`,
      args: [plan, stripeCustomerId || null, stripeSubscriptionId || null, now, orgId],
    });
  }

  return getOrganizationById(orgId);
}

export async function updateOrganizationDetails(
  orgId: string,
  data: { name?: string; slug?: string; logoUrl?: string }
): Promise<Organization | null> {
  getDb();
  const now = Date.now();

  if (isPostgres) {
    await (dbInstance as any).update(schema.organizationsPg)
      .set({
        ...data,
        updatedAt: new Date(now),
      })
      .where((o: any, { eq }: any) => eq(o.id, orgId));
  } else {
    if (data.name && data.slug) {
      await rawLibsqlClient.execute({
        sql: `UPDATE organizations SET name = ?, slug = ?, updated_at = ? WHERE id = ?`,
        args: [data.name, data.slug, now, orgId],
      });
    } else if (data.name) {
      await rawLibsqlClient.execute({
        sql: `UPDATE organizations SET name = ?, updated_at = ? WHERE id = ?`,
        args: [data.name, now, orgId],
      });
    }
  }

  return getOrganizationById(orgId);
}

export async function deleteOrganization(orgId: string): Promise<boolean> {
  getDb();
  if (isPostgres) {
    await (dbInstance as any).delete(schema.organizationsPg)
      .where((o: any, { eq }: any) => eq(o.id, orgId));
  } else {
    await rawLibsqlClient.execute({
      sql: `DELETE FROM organizations WHERE id = ?`,
      args: [orgId],
    });
  }
  return true;
}

export async function ensureDefaultWorkspace(user: {
  id: string;
  name?: string | null;
  email: string;
}): Promise<WorkspaceWithRole> {
  const orgs = await getUserOrganizations(user.id);
  if (orgs.length > 0) {
    return orgs[0];
  }

  // Create personal workspace for user
  const personalName = user.name ? `${user.name}'s Workspace` : 'My Workspace';
  return createOrganization({
    name: personalName,
    ownerUserId: user.id,
    plan: 'free',
  });
}


