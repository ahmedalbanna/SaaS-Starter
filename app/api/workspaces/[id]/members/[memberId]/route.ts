import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getUserMembership,
  updateMemberRole,
  removeMember,
  getOrganizationMembers,
  logActivity,
} from '@/lib/db';
import { canManageTeam } from '@/lib/workspace';
import type { OrganizationRole } from '@/lib/db/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orgId, memberId } = await params;
    const currentMem = await getUserMembership(orgId, session.user.id);
    if (!currentMem || !canManageTeam(currentMem.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Requires admin or owner privileges' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const newRole = body.role as OrganizationRole;

    if (!newRole || !['owner', 'admin', 'billing_manager', 'member'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    // Only owner can assign owner role
    if (newRole === 'owner' && currentMem.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only existing workspace owners can transfer or grant owner role' },
        { status: 403 }
      );
    }

    await updateMemberRole(memberId, newRole);

    await logActivity(
      session.user.id,
      'member_role_updated',
      `Updated membership ${memberId} role to "${newRole}" in workspace ${orgId}`
    );

    return NextResponse.json({
      success: true,
      role: newRole,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/[id]/members/[memberId] PATCH] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orgId, memberId } = await params;
    const currentMem = await getUserMembership(orgId, session.user.id);
    if (!currentMem) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await getOrganizationMembers(orgId);
    const targetMember = members.find((m) => m.id === memberId);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can only remove if user is owner/admin OR removing themselves
    const isSelf = targetMember.userId === session.user.id;
    if (!isSelf && !canManageTeam(currentMem.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Requires admin or owner privileges' },
        { status: 403 }
      );
    }

    // Prevent removing the sole owner
    if (targetMember.role === 'owner') {
      const owners = members.filter((m) => m.role === 'owner');
      if (owners.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the sole owner of a workspace' },
          { status: 400 }
        );
      }
    }

    await removeMember(memberId);

    await logActivity(
      session.user.id,
      'member_removed',
      `Removed user ${targetMember.email} from workspace ${orgId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Member successfully removed',
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/[id]/members/[memberId] DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
