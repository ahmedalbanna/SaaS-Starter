import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserMembership } from '@/lib/db';
import { cookies } from 'next/headers';
import { ACTIVE_WORKSPACE_COOKIE } from '@/lib/workspace';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const workspaceId = body.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Verify user is actually a member of this workspace
    const membership = await getUserMembership(workspaceId, session.user.id);
    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this workspace' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Accessible by client context if needed
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      activeWorkspaceId: workspaceId,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/switch POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
