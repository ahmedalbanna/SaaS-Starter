import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isOpenAIConfigured, OPENAI_MODELS, SYSTEM_PROMPT_PRESETS } from '@/lib/openai';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConfigured = isOpenAIConfigured();

    return NextResponse.json({
      configured: isConfigured,
      models: OPENAI_MODELS,
      presets: SYSTEM_PROMPT_PRESETS,
      notice: isConfigured
        ? 'Connected to OpenAI API'
        : 'OpenAI API key not detected. Running in developer preview mode.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve AI status' },
      { status: 500 }
    );
  }
}
