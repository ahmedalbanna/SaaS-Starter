import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, updateUserPassword } from '@/lib/db';
import { verifyResetToken, consumeResetToken } from '@/lib/auth-tokens';

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json(
        { error: 'Email, reset token, and new password are required' },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const normEmail = String(email).toLowerCase().trim();

    // Verify token
    const isValid = verifyResetToken(token, normEmail);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token. Please request a new one.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(normEmail);
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await updateUserPassword(user.id, passwordHash);
    consumeResetToken(token);

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. You may now sign in.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
