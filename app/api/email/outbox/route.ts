import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDevOutbox } from '@/lib/email';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const outbox = getDevOutbox();
  return NextResponse.json({ outbox });
}
