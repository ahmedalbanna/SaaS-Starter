import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getSubscriptionByUserId, getUserByEmail } from '@/lib/db';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // If user is not authenticated, redirect to sign in with callback
  if (!session?.user) {
    redirect('/login?callbackUrl=/app');
  }

  // Fetch live subscription record from Drizzle ORM
  let subscription = null;
  if (session.user.id) {
    subscription = await getSubscriptionByUserId(session.user.id);
  }

  return (
    <DashboardShell
      user={{
        id: session.user.id || '',
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: (session.user as any).role || 'user',
      }}
      subscription={subscription}
    >
      {children}
    </DashboardShell>
  );
}
