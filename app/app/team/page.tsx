'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle2,
  Trash2,
  Building2,
  Loader2,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { useWorkspace } from '@/components/providers/workspace-provider';
import type { WorkspaceMemberInfo, OrganizationRole, WorkspaceWithRole } from '@/lib/db/types';

interface TeamViewProps {
  workspace: WorkspaceWithRole;
  canManageTeam: boolean;
  isOwner: boolean;
}

function TeamView({ workspace, canManageTeam, isOwner }: TeamViewProps) {
  const [members, setMembers] = React.useState<WorkspaceMemberInfo[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<OrganizationRole>('member');
  const [inviting, setInviting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [updatingMemberId, setUpdatingMemberId] = React.useState<string | null>(null);

  const reloadMembers = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`);
      if (!res.ok) throw new Error('Failed to load team members');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: any) {
      setError(err.message || 'Error loading members');
    }
  }, [workspace.id]);

  React.useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      try {
        const res = await fetch(`/api/workspaces/${workspace.id}/members`);
        if (!res.ok) throw new Error('Failed to load team members');
        const data = await res.json();
        if (!ignore) {
          setMembers(data.members || []);
          setLoading(false);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || 'Error loading members');
          setLoading(false);
        }
      }
    }

    initialFetch();
    return () => {
      ignore = true;
    };
  }, [workspace.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setNotice(null);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setNotice({
        type: 'success',
        text: data.message || `Successfully invited ${inviteEmail}!`,
      });
      setInviteEmail('');
      await reloadMembers();
      setTimeout(() => setNotice(null), 6000);
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to invite member',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrganizationRole) => {
    setUpdatingMemberId(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/members/${memberId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update role');
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating member role');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from this workspace?`)) return;

    try {
      const res = await fetch(
        `/api/workspaces/${workspace.id}/members/${memberId}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      alert(err.message || 'Error removing member');
    }
  };

  const getRoleBadgeStyle = (role: OrganizationRole) => {
    switch (role) {
      case 'owner':
        return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
      case 'admin':
        return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'billing_manager':
        return 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Team &amp; Collaborators
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage RBAC permissions and team seats for workspace{' '}
            <strong className="text-neutral-900 font-semibold">{workspace.name}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1 text-xs py-1 px-2.5">
            <Building2 className="w-3.5 h-3.5 text-neutral-500" />
            <span className="font-semibold">{workspace.name}</span>
            <span className="text-neutral-400 font-mono text-[10px]">({workspace.userRole})</span>
          </Badge>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Invite Member Card */}
      {canManageTeam ? (
        <Card className="shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-neutral-600" />
              <span>Invite New Team Member</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Dispatches a branded invitation with a secure token to join this isolated workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <Input
                  type="email"
                  required
                  placeholder="colleague@yourcompany.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9 text-xs"
                  disabled={inviting}
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                disabled={inviting}
                className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-xs text-neutral-700 outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
              >
                <option value="member">Member (Read &amp; Execute)</option>
                <option value="billing_manager">Billing Manager (Invoices &amp; Plan)</option>
                <option value="admin">Admin (Team &amp; Settings)</option>
                {isOwner && <option value="owner">Owner (Full Authority)</option>}
              </select>
              <Button
                type="submit"
                size="sm"
                disabled={inviting || !inviteEmail.trim()}
                className="text-xs font-medium shrink-0"
              >
                {inviting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 text-neutral-400" />
          <span>You have <strong>{workspace.userRole}</strong> access. Only workspace admins and owners can invite new teammates.</span>
        </div>
      )}

      {/* Members List Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-600" />
              <span>Workspace Members ({members.length})</span>
            </CardTitle>
            <span className="text-[11px] text-neutral-400">
              Role-Based Access Control
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              <span>Loading workspace members...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-600">{error}</div>
          ) : members.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No members found in this workspace.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {members.map((member) => {
                const isMemberOwner = member.role === 'owner';
                const canModifyThisMember =
                  canManageTeam &&
                  (!isMemberOwner || isOwner);

                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-medium text-xs flex items-center justify-center shrink-0 dark:bg-neutral-100 dark:text-neutral-900">
                        {(member.name?.[0] || member.email[0] || 'U').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 truncate">
                          <span>{member.name || member.email.split('@')[0]}</span>
                          {isMemberOwner && (
                            <span title="Workspace Owner">
                              <Crown className="w-3.5 h-3.5 text-amber-500 inline" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate">
                          {member.email} &bull; Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      {canModifyThisMember && !isMemberOwner ? (
                        <select
                          value={member.role}
                          disabled={updatingMemberId === member.id}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as OrganizationRole)
                          }
                          className="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                        >
                          <option value="member">Member</option>
                          <option value="billing_manager">Billing Manager</option>
                          <option value="admin">Admin</option>
                          {isOwner && <option value="owner">Owner</option>}
                        </select>
                      ) : (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-mono font-medium uppercase tracking-wider ${getRoleBadgeStyle(
                            member.role
                          )}`}
                        >
                          {member.role.replace('_', ' ')}
                        </span>
                      )}

                      {canModifyThisMember && !isMemberOwner && (
                        <button
                          onClick={() => handleRemove(member.id, member.email)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamPage() {
  const { currentWorkspace, canManageTeam, isOwner } = useWorkspace();

  if (!currentWorkspace) {
    return (
      <div className="p-8 flex items-center justify-center gap-2 text-xs text-neutral-500">
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  return (
    <TeamView
      key={currentWorkspace.id}
      workspace={currentWorkspace}
      canManageTeam={canManageTeam}
      isOwner={isOwner}
    />
  );
}
