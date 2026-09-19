import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getSubscriptionByUserId } from '@/lib/db';
import { getServerActiveWorkspace } from '@/lib/workspace';
import { WorkspaceProvider } from '@/components/providers/workspace-provider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // If user is not authenticated, redirect to sign in with callback
  if (!session?.user) {
    redirect('/login?callbackUrl=/app');
  }

  // Resolve active multi-tenant workspace context for user
  const { activeWorkspace, workspaces } = await getServerActiveWorkspace({
    id: session.user.id || '',
    email: session.user.email || 'user@example.com',
    name: session.user.name,
  });

  // Fetch live subscription record from Drizzle ORM
  let subscription = null;
  if (session.user.id) {
    subscription = await getSubscriptionByUserId(session.user.id);
  }

  return (
    <WorkspaceProvider initialWorkspace={activeWorkspace} initialWorkspaces={workspaces}>
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
    </WorkspaceProvider>
  );
}
