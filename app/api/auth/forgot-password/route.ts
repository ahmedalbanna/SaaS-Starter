import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getUserByEmail, logActivity } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { storeResetToken } from '@/lib/auth-tokens';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const normEmail = String(email).toLowerCase().trim();
    const user = await getUserByEmail(normEmail);

    // If user exists, generate token and dispatch reset email
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      storeResetToken(token, normEmail, 60 * 60 * 1000);

      await sendPasswordResetEmail(normEmail, token);
      await logActivity(user.id, 'password_reset_requested', `Password reset token generated`);
    }

    // Always return success to prevent user enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 });
  }
}
