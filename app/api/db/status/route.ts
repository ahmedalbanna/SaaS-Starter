import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabaseDiagnostics } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const diagnostics = await getDatabaseDiagnostics();
  return NextResponse.json(diagnostics);
}
