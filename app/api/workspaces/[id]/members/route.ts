import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getOrganizationById,
  getUserMembership,
  getOrganizationMembers,
  addOrganizationMember,
  getUserByEmail,
  createOrganizationInvitation,
  logActivity,
} from '@/lib/db';
import { canManageTeam } from '@/lib/workspace';
import { sendEmail, getInvitationEmailTemplate } from '@/lib/email';
import type { OrganizationRole } from '@/lib/db/types';

export async function GET(
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
    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this workspace' },
        { status: 403 }
      );
    }

    const members = await getOrganizationMembers(orgId);

    return NextResponse.json({
      members,
      currentUserRole: membership.role,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/[id]/members GET] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orgId } = await params;
    const currentMem = await getUserMembership(orgId, session.user.id);
    if (!currentMem || !canManageTeam(currentMem.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Requires admin or owner privileges' },
        { status: 403 }
      );
    }

    const org = await getOrganizationById(orgId);
    if (!org) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const role = (body.role as OrganizationRole) || 'member';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // Check if user is already a member
      const existingMem = await getUserMembership(orgId, existingUser.id);
      if (existingMem) {
        return NextResponse.json(
          { error: 'User is already a member of this workspace' },
          { status: 400 }
        );
      }

      // Directly add to workspace
      const newMembership = await addOrganizationMember(orgId, existingUser.id, role);

      await logActivity(
        session.user.id,
        'team_member_added',
        `Added ${email} to workspace "${org.name}" with role "${role}"`
      );

      return NextResponse.json({
        type: 'added',
        membership: newMembership,
        message: `Successfully added ${email} to ${org.name}.`,
      });
    }

    // Otherwise create pending invitation token and send email
    const invitation = await createOrganizationInvitation({
      organizationId: orgId,
      email,
      role,
    });

    const host = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${host}/register?invite=${invitation.token}&email=${encodeURIComponent(email)}`;

    const emailContent = getInvitationEmailTemplate({
      workspaceName: org.name,
      inviterName: session.user.name || session.user.email || 'A team member',
      inviteUrl,
      role,
    });

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${org.name} on SaaS Starter`,
      html: emailContent.html,
      text: emailContent.text,
    });

    await logActivity(
      session.user.id,
      'team_invitation_sent',
      `Sent invitation email to ${email} for workspace "${org.name}" (${role})`
    );

    return NextResponse.json({
      type: 'invited',
      invitation,
      message: `Invitation email sent to ${email}.`,
    });
  } catch (err: any) {
    console.error('[API /api/workspaces/[id]/members POST] Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
