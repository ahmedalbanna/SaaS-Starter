'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Copy, Check, ShieldAlert, Loader2, Save } from 'lucide-react';
import { useWorkspace } from '@/components/providers/workspace-provider';
import type { WorkspaceWithRole } from '@/lib/db/types';

interface InnerFormProps {
  workspace: WorkspaceWithRole;
  canManageSettings: boolean;
  isOwner: boolean;
  onUpdate: (data: { name?: string; slug?: string }) => Promise<void>;
}

function WorkspaceSettingsForm({
  workspace,
  canManageSettings,
  isOwner,
  onUpdate,
}: InnerFormProps) {
  const [name, setName] = React.useState(workspace.name);
  const [slug, setSlug] = React.useState(workspace.slug);
  const [isSaving, setIsSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteInput, setDeleteInput] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(workspace.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;

    setIsSaving(true);
    try {
      await onUpdate({ name, slug });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save workspace settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== workspace.name) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete workspace');
      }
      window.location.href = '/app';
    } catch (err: any) {
      alert(err.message || 'Error deleting workspace');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              <CardTitle className="text-sm font-semibold">Workspace Profile</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400">Your Role:</span>
              <Badge variant="outline" className="text-[10px] capitalize font-mono">
                {workspace.userRole}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs">
            Manage organization identity, slug identifier, and multi-tenant metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Workspace Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManageSettings || isSaving}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Workspace Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!canManageSettings || isSaving}
                  required
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Workspace ID
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={workspace.id}
                  readOnly
                  className="text-xs font-mono bg-neutral-50 text-neutral-600 dark:bg-neutral-900"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyId}
                  className="shrink-0 text-xs"
                >
                  {copiedId ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {copiedId ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {canManageSettings && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-emerald-600">
                  {savedSuccess && 'Workspace changes saved successfully!'}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving || (name === workspace.name && slug === workspace.slug)}
                  className="text-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone: Workspace Deletion */}
      {isOwner && (
        <Card className="border-red-200 dark:border-red-900/50 shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              <CardTitle className="text-sm font-semibold">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Permanently delete this workspace, all member invitations, and associated tenant records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                  This action cannot be undone. Only the workspace owner can perform this operation.
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs"
                >
                  Delete Workspace
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-900">
                <div className="text-xs font-medium text-red-800 dark:text-red-300">
                  To confirm deletion, please type the workspace name: <strong>{workspace.name}</strong>
                </div>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder={workspace.name}
                  className="text-xs border-red-300"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInput('');
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deleteInput !== workspace.name || isDeleting}
                    onClick={handleDelete}
                    className="text-xs"
                  >
                    {isDeleting ? 'Deleting...' : 'I understand, delete this workspace'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function WorkspaceSettingsCard() {
  const { currentWorkspace, canManageSettings, isOwner, updateWorkspace } = useWorkspace();

  if (!currentWorkspace) return null;

  // Keyed on workspace.id to automatically reset internal input state on switch without useEffect
  return (
    <WorkspaceSettingsForm
      key={currentWorkspace.id}
      workspace={currentWorkspace}
      canManageSettings={canManageSettings}
      isOwner={isOwner}
      onUpdate={updateWorkspace}
    />
  );
}
