import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getOrganizationById,
  getUserMembership,
  updateOrganizationDetails,
  deleteOrganization,
  getUserOrganizations,
  logActivity,
} from '@/lib/db';
import { canManageSettings, isOwner } from '@/lib/workspace';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orgId } = await params;
    const membership = await getUserMembership(orgId, session.user.id);
    if (!membership || !canManageSettings(membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Requires admin or owner privileges' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = body.name?.trim();
    const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

    const updated = await updateOrganizationDetails(orgId, {
      name,
      slug,
    });

    await logActivity(
      session.user.id,
      'workspace_updated',
      `Updated settings for workspace "${updated?.name}" (${orgId})`
    );

    return NextResponse.json({
      workspace: updated,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/[id] PATCH] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orgId } = await params;
    const membership = await getUserMembership(orgId, session.user.id);
    if (!membership || !isOwner(membership.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only the workspace owner can delete this organization' },
        { status: 403 }
      );
    }

    // Safety constraint: Cannot delete if it is the user's only workspace
    const userOrgs = await getUserOrganizations(session.user.id);
    if (userOrgs.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete your only workspace. Please create another workspace first.' },
        { status: 400 }
      );
    }

    await deleteOrganization(orgId);

    await logActivity(
      session.user.id,
      'workspace_deleted',
      `Permanently deleted workspace ${orgId}`
    );

    return NextResponse.json({
      success: true,
      message: 'Workspace successfully deleted',
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/[id] DELETE] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
