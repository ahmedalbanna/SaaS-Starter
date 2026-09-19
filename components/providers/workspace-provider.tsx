'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { WorkspaceWithRole, OrganizationRole } from '@/lib/db/types';

interface WorkspaceContextType {
  currentWorkspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string, plan?: 'free' | 'pro' | 'enterprise') => Promise<WorkspaceWithRole>;
  updateWorkspace: (data: { name?: string; slug?: string }) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  isSwitching: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canManageSettings: boolean;
  isOwner: boolean;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({
  initialWorkspace,
  initialWorkspaces,
  children,
}: {
  initialWorkspace: WorkspaceWithRole;
  initialWorkspaces: WorkspaceWithRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentWorkspace, setCurrentWorkspace] = React.useState<WorkspaceWithRole>(initialWorkspace);
  const [workspaces, setWorkspaces] = React.useState<WorkspaceWithRole[]>(initialWorkspaces);
  const [isSwitching, setIsSwitching] = React.useState(false);

  // Sync state during render when props update across SSR navigation
  const [prevWorkspace, setPrevWorkspace] = React.useState(initialWorkspace);
  if (
    prevWorkspace.id !== initialWorkspace.id ||
    prevWorkspace.name !== initialWorkspace.name ||
    prevWorkspace.plan !== initialWorkspace.plan
  ) {
    setPrevWorkspace(initialWorkspace);
    setCurrentWorkspace(initialWorkspace);
  }

  const [prevWorkspacesLength, setPrevWorkspacesLength] = React.useState(initialWorkspaces.length);
  if (prevWorkspacesLength !== initialWorkspaces.length) {
    setPrevWorkspacesLength(initialWorkspaces.length);
    setWorkspaces(initialWorkspaces);
  }

  const refreshWorkspaces = React.useCallback(async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        if (data.activeWorkspace) {
          setCurrentWorkspace(data.activeWorkspace);
        }
      }
    } catch (err) {
      console.error('Failed to refresh workspaces:', err);
    }
  }, []);

  const switchWorkspace = React.useCallback(
    async (workspaceId: string) => {
      if (workspaceId === currentWorkspace.id || isSwitching) return;
      setIsSwitching(true);
      try {
        const res = await fetch('/api/workspaces/switch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId }),
        });

        if (res.ok) {
          const target = workspaces.find((w) => w.id === workspaceId);
          if (target) {
            setCurrentWorkspace(target);
          }
          router.refresh();
        }
      } catch (err) {
        console.error('Failed to switch workspace:', err);
      } finally {
        setIsSwitching(false);
      }
    },
    [currentWorkspace.id, isSwitching, router, workspaces]
  );

  const createWorkspace = React.useCallback(
    async (name: string, plan: 'free' | 'pro' | 'enterprise' = 'free'): Promise<WorkspaceWithRole> => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, plan }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create workspace');
      }

      const data = await res.json();
      const newWs = data.workspace as WorkspaceWithRole;

      setWorkspaces((prev) => [...prev, newWs]);
      setCurrentWorkspace(newWs);

      // Auto switch cookie
      await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: newWs.id }),
      });

      router.refresh();
      return newWs;
    },
    [router]
  );

  const updateWorkspace = React.useCallback(
    async (data: { name?: string; slug?: string }) => {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update workspace');
      }

      const result = await res.json();
      const updated = {
        ...currentWorkspace,
        ...result.workspace,
      };

      setCurrentWorkspace(updated);
      setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      router.refresh();
    },
    [currentWorkspace, router]
  );

  const role = currentWorkspace.userRole;
  const canManageTeam = role === 'owner' || role === 'admin';
  const canManageBilling = role === 'owner' || role === 'billing_manager';
  const canManageSettings = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  const value = React.useMemo(
    () => ({
      currentWorkspace,
      workspaces,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      refreshWorkspaces,
      isSwitching,
      canManageTeam,
      canManageBilling,
      canManageSettings,
      isOwner,
    }),
    [
      currentWorkspace,
      workspaces,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      refreshWorkspaces,
      isSwitching,
      canManageTeam,
      canManageBilling,
      canManageSettings,
      isOwner,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export function useOptionalWorkspace() {
  return React.useContext(WorkspaceContext);
}
