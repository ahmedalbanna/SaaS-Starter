import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createOrganization,
  getUserOrganizations,
  ensureDefaultWorkspace,
  logActivity,
} from '@/lib/db';
import { cookies } from 'next/headers';
import { ACTIVE_WORKSPACE_COOKIE } from '@/lib/workspace';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let workspaces = await getUserOrganizations(session.user.id);
    if (workspaces.length === 0) {
      const defaultWs = await ensureDefaultWorkspace({
        id: session.user.id,
        email: session.user.email || 'user@example.com',
        name: session.user.name,
      });
      workspaces = [defaultWs];
    }

    const cookieStore = await cookies();
    const activeOrgId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
    const activeWorkspace =
      workspaces.find((w) => w.id === activeOrgId) || workspaces[0];

    return NextResponse.json({
      workspaces,
      activeWorkspace,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const plan = (body.plan as 'free' | 'pro' | 'enterprise') || 'free';

    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const newWorkspace = await createOrganization({
      name,
      ownerUserId: session.user.id,
      plan,
    });

    await logActivity(
      session.user.id,
      'workspace_created',
      `Created workspace "${name}" (${newWorkspace.id})`
    );

    return NextResponse.json({
      workspace: newWorkspace,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
