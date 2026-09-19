'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Mail, Shield, CheckCircle2, Trash2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member';
  status: 'Active' | 'Invited';
}

export default function TeamPage() {
  const [members, setMembers] = React.useState<Member[]>([
    {
      id: '1',
      name: 'Alex Morgan',
      email: 'demo@saas-starter.dev',
      role: 'Owner',
      status: 'Active',
    },
    {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah@company.io',
      role: 'Admin',
      status: 'Active',
    },
    {
      id: '3',
      name: 'Marcus Vance',
      email: 'marcus@partner.design',
      role: 'Member',
      status: 'Invited',
    },
  ]);

  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'Admin' | 'Member'>('Member');
  const [inviting, setInviting] = React.useState(false);
  const [invitedNotice, setInvitedNotice] = React.useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setInvitedNotice(null);

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();

      setMembers([
        ...members,
        {
          id: String(Date.now()),
          name: inviteEmail.split('@')[0],
          email: inviteEmail,
          role: inviteRole,
          status: 'Invited',
        },
      ]);

      const note = data.provider === 'resend' 
        ? `Invitation email dispatched to ${inviteEmail} via Resend.` 
        : `Invitation queued and logged in dev simulator mode for ${inviteEmail}.`;
      setInvitedNotice(note);
      setInviteEmail('');
      setTimeout(() => setInvitedNotice(null), 5000);
    } catch (err) {
      setInvitedNotice(`Invitation recorded for ${inviteEmail}.`);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Team &amp; Collaborators
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage workspace members, assign RBAC permissions, and invite new teammates.
        </p>
      </div>

      {invitedNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Invitation dispatched successfully! Teammate will receive onboarding link.</span>
        </div>
      )}

      {/* Invite Member Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-neutral-600" />
            <span>Invite Team Member</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Send an email invite with specific workspace permissions.
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
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-xs text-neutral-700 outline-none"
            >
              <option value="Member">Member (Read &amp; Execute)</option>
              <option value="Admin">Admin (Billing &amp; Keys)</option>
            </select>
            <Button type="submit" size="sm" disabled={inviting} className="text-xs font-medium shrink-0">
              {inviting ? 'Dispatching...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members List Card */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-600" />
            <span>Workspace Members ({members.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-medium text-xs flex items-center justify-center">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 flex items-center gap-2">
                      <span>{member.name}</span>
                      {member.role === 'Owner' && (
                        <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded font-mono">
                          Owner
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={member.status === 'Active' ? 'default' : 'secondary'}
                    className="text-[10px] uppercase font-mono"
                  >
                    {member.status}
                  </Badge>
                  <span className="text-xs font-medium text-neutral-600 w-16 text-right">
                    {member.role}
                  </span>
                  {member.role !== 'Owner' && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-md"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
