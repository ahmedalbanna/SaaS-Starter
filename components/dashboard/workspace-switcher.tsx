'use client';

import * as React from 'react';
import {
  Building2,
  Check,
  ChevronsUpDown,
  PlusCircle,
  Sparkles,
  Shield,
  Loader2,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace, createWorkspace, isSwitching } =
    useWorkspace();
  const [open, setOpen] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [newOrgName, setNewOrgName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    try {
      await createWorkspace(newOrgName.trim());
      setNewOrgName('');
      setShowCreateModal(false);
      setOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200';
      case 'billing_manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200';
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        id="workspace-switcher-button"
        onClick={() => setOpen(!open)}
        disabled={isSwitching}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-2 text-left text-sm transition-all hover:bg-neutral-100/80 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-800/80"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white font-semibold text-xs shadow-2xs dark:bg-neutral-100 dark:text-neutral-900">
            {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
          </div>
          <div className="truncate min-w-0">
            <div className="truncate font-medium text-xs text-neutral-900 dark:text-neutral-100">
              {currentWorkspace?.name || 'My Workspace'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
              <span className="capitalize">{currentWorkspace?.userRole || 'member'}</span>
              <span>&bull;</span>
              <span className="capitalize">{currentWorkspace?.plan || 'free'}</span>
            </div>
          </div>
        </div>
        {isSwitching ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-400" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-neutral-400" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          id="workspace-switcher-menu"
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[240px] rounded-lg border border-neutral-200 bg-white p-1.5 shadow-xl transition-all dark:border-neutral-800 dark:bg-neutral-900 animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Workspaces
          </div>

          <div className="max-h-[220px] overflow-y-auto space-y-0.5">
            {workspaces.map((ws) => {
              const isActive = ws.id === currentWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    switchWorkspace(ws.id);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
                    isActive
                      ? 'bg-neutral-100 font-medium text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                      : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <div className="truncate">
                      <div className="truncate font-medium">{ws.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {ws.slug}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider ${getRoleBadgeVariant(
                        ws.userRole
                      )}`}
                    >
                      {ws.userRole}
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="my-1.5 h-px bg-neutral-100 dark:bg-neutral-800" />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setShowCreateModal(true);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-neutral-500" />
            <span>Create New Workspace</span>
          </button>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div
            className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                  Create Workspace
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Workspace Name
                </label>
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Acme Studio, Beta Launch"
                  required
                  autoFocus
                  className="text-xs"
                />
                <p className="text-[11px] text-neutral-400">
                  This will create an isolated tenant with its own team members, subscriptions, and settings.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || !newOrgName.trim()}
                  className="bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Workspace'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
