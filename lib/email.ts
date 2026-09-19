export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: number;
  provider: 'resend' | 'dev_simulator';
}

// In-memory buffer for developer inspection of dispatched emails in dev mode
const devOutbox: SentEmailRecord[] = [];

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id: string; provider: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = payload.from || process.env.EMAIL_FROM || 'Acme SaaS <onboarding@resend.dev>';
  const id = `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch email through Resend');
      }

      return { success: true, id: data.id || id, provider: 'resend' };
    } catch (err: any) {
      console.error('[email] Resend API Error, falling back to logger:', err?.message);
    }
  }

  // Developer Simulator Mode (Zero external dependencies required)
  const record: SentEmailRecord = {
    id,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    sentAt: Date.now(),
    provider: 'dev_simulator',
  };

  devOutbox.unshift(record);
  if (devOutbox.length > 30) devOutbox.pop();

  console.log(`\n================== [DEV TRANSACTIONAL EMAIL] ==================`);
  console.log(`To:      ${payload.to}`);
  console.log(`From:    ${from}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Preview: ${payload.text || payload.html.replace(/<[^>]*>?/gm, '').slice(0, 160)}...`);
  console.log(`================================================================\n`);

  return { success: true, id, provider: 'dev_simulator' };
}

export function getDevOutbox(): SentEmailRecord[] {
  return [...devOutbox];
}

// Pre-built SaaS templates
export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return sendEmail({
    to,
    subject: 'Welcome to SaaS Starter! Your workspace is ready.',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #171717;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Welcome, ${name}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #525252;">
          Thank you for joining SaaS Starter. Your account is configured with secure credentials and ready for immediate use.
        </p>
        <div style="margin: 28px 0;">
          <a href="${appUrl}/app" style="display: inline-block; background: #0a0a0a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Launch App Dashboard
          </a>
        </div>
        <p style="font-size: 12px; color: #737373; border-top: 1px solid #e5e5e5; padding-top: 16px;">
          SaaS Starter • Next.js 15, Auth.js, and Drizzle ORM.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(to)}`;

  return sendEmail({
    to,
    subject: 'Reset your password - SaaS Starter',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #171717;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Password Reset Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #525252;">
          We received a request to reset your password. Click the link below to select a new secure password. This link will expire in 1 hour.
        </p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #0a0a0a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 12px; color: #737373;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendTeamInviteEmail(to: string, inviterName: string, role: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return sendEmail({
    to,
    subject: `${inviterName} invited you to join their SaaS workspace`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #171717;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">You've been invited!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #525252;">
          ${inviterName} invited you to collaborate as an <strong>${role}</strong> in their SaaS workspace.
        </p>
        <div style="margin: 28px 0;">
          <a href="${appUrl}/register?email=${encodeURIComponent(to)}" style="display: inline-block; background: #0a0a0a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Accept Invitation &amp; Join
          </a>
        </div>
      </div>
    `,
  });
}
