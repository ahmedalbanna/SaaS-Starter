import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logActivity } from '@/lib/db';
import { sendTeamInviteEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, role } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const inviterName = session.user.name || session.user.email || 'A team member';
    const assignedRole = role || 'Member';

    // Dispatch real email or dev simulator notification
    const emailResult = await sendTeamInviteEmail(email, inviterName, assignedRole);

    await logActivity(
      session.user.id,
      'team_member_invited',
      `Invited ${email} as ${assignedRole} (${emailResult.provider})`
    );

    return NextResponse.json({
      success: true,
      message: `Invitation email dispatched to ${email}`,
      provider: emailResult.provider,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to dispatch team invitation' }, { status: 500 });
  }
}
