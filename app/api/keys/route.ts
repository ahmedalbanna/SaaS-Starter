import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getApiKeys, createApiKey, deleteApiKey } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await getApiKeys(session.user.id);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = body.name || 'Default Secret Key';

  const result = await createApiKey(session.user.id, name);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get('id');
  if (!keyId) {
    return NextResponse.json({ error: 'Key ID required' }, { status: 400 });
  }

  await deleteApiKey(session.user.id, keyId);
  return NextResponse.json({ success: true });
}
