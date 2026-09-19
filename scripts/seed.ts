import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, upsertSubscription, logActivity, createApiKey } from '../lib/db';

async function main() {
  console.log('🌱 [seed] Starting database seed...');

  // 1. Seed Demo Admin User
  const demoEmail = 'demo@saas-starter.dev';
  let demoUser = await getUserByEmail(demoEmail);

  if (!demoUser) {
    const passwordHash = await bcrypt.hash('password123', 10);
    demoUser = await createUser({
      name: 'Alex Morgan',
      email: demoEmail,
      passwordHash,
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    });
    console.log(`✅ [seed] Created demo user: ${demoEmail} (password: password123)`);
  } else {
    console.log(`ℹ️ [seed] Demo user already exists: ${demoEmail}`);
  }

  // 2. Set Demo User Subscription to Pro
  await upsertSubscription({
    userId: demoUser.id,
    planId: 'pro',
    status: 'active',
    stripeCustomerId: 'cus_demo_mock_123',
    stripeSubscriptionId: 'sub_demo_mock_pro_456',
    currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
  console.log('✅ [seed] Provisioned active Pro subscription for demo user');

  // 3. Seed demo activity logs
  await logActivity(demoUser.id, 'subscription_upgraded', 'Upgraded to Pro Plan ($29/month)');
  await logActivity(demoUser.id, 'team_invite_sent', 'Invited team member to Acme Workspace');
  await logActivity(demoUser.id, 'api_key_generated', 'Created Production Ingestion API key');
  console.log('✅ [seed] Logged sample activity records');

  // 4. Seed an initial API Key
  await createApiKey(demoUser.id, 'Production API Key (Default)');
  console.log('✅ [seed] Created sample API Key');

  // 5. Seed standard user
  const standardEmail = 'sarah@company.io';
  const existingStandard = await getUserByEmail(standardEmail);
  if (!existingStandard) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const standardUser = await createUser({
      name: 'Sarah Chen',
      email: standardEmail,
      passwordHash,
      role: 'user',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
    });
    await upsertSubscription({
      userId: standardUser.id,
      planId: 'free',
      status: 'active',
    });
    console.log(`✅ [seed] Created standard user: ${standardEmail} (password: password123)`);
  }

  console.log('✨ [seed] Database seeding completed successfully!');
}

main().catch((err) => {
  console.error('❌ [seed] Error seeding database:', err);
  process.exit(1);
});
