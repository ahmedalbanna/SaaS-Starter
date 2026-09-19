import { cookies } from 'next/headers';
import {
  getUserOrganizations,
  ensureDefaultWorkspace,
  getUserMembership,
} from '@/lib/db';
import type { WorkspaceWithRole, OrganizationRole } from '@/lib/db/types';

export const ACTIVE_WORKSPACE_COOKIE = 'active_workspace_id';

export interface WorkspaceSessionData {
  activeWorkspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
}

export async function getServerActiveWorkspace(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<WorkspaceSessionData> {
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  let workspaces = await getUserOrganizations(user.id);

  // If user has no workspaces yet, provision an initial personal workspace
  if (workspaces.length === 0) {
    const defaultWs = await ensureDefaultWorkspace(user);
    workspaces = [defaultWs];
  }

  let activeWorkspace: WorkspaceWithRole | undefined;

  if (activeOrgId) {
    activeWorkspace = workspaces.find((w) => w.id === activeOrgId);
  }

  if (!activeWorkspace) {
    activeWorkspace = workspaces[0];
  }

  return {
    activeWorkspace,
    workspaces,
  };
}

export async function verifyUserWorkspaceAccess(
  orgId: string,
  userId: string
): Promise<{ allowed: boolean; role?: OrganizationRole; membershipId?: string }> {
  const mem = await getUserMembership(orgId, userId);
  if (!mem) {
    return { allowed: false };
  }
  return { allowed: true, role: mem.role, membershipId: mem.id };
}

// Role-based access control helpers
export function canManageTeam(role: OrganizationRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageBilling(role: OrganizationRole): boolean {
  return role === 'owner' || role === 'billing_manager';
}

export function canManageSettings(role: OrganizationRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function isOwner(role: OrganizationRole): boolean {
  return role === 'owner';
}
