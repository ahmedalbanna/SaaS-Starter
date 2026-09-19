import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOpenAI, isOpenAIConfigured, SYSTEM_PROMPT_PRESETS } from '@/lib/openai';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function generateSimulatedResponse(userPrompt: string, systemPromptId?: string): string {
  const lower = userPrompt.toLowerCase();

  if (lower.includes('sql') || lower.includes('database') || lower.includes('query')) {
    return `Here is an optimized SQL query for tracking active subscriptions and recurring monthly revenue:

\`\`\`sql
-- Calculate Monthly Recurring Revenue (MRR) by Active Plan
SELECT 
  plan_id,
  COUNT(id) AS active_subscribers,
  SUM(CASE 
    WHEN plan_id = 'pro' THEN 29.00
    WHEN plan_id = 'enterprise' THEN 99.00
    ELSE 0.00
  END) AS estimated_mrr_usd
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_id
ORDER BY estimated_mrr_usd DESC;
\`\`\`

**Indexing Tip**: Ensure you have a composite index on \`(status, plan_id)\` to optimize filtering over large subscriber tables.`;
  }

  if (lower.includes('stripe') || lower.includes('webhook') || lower.includes('billing')) {
    return `### Stripe Webhook Best Practices for Next.js

1. **Verify Signatures Securely**: Always retrieve the raw request buffer before parsing JSON, passing \`stripe.webhooks.constructEvent(buf, sig, secret)\`.
2. **Idempotent Handlers**: Store handled \`event.id\` values in your database to prevent duplicate processing on webhook retries.
3. **Handle Essential Events**:
   - \`customer.subscription.created\`
   - \`customer.subscription.updated\`
   - \`customer.subscription.deleted\`
   - \`invoice.payment_succeeded\`
   - \`invoice.payment_failed\`

*Note: In local development or sandbox stub mode, you can test these flows immediately without requiring live webhook endpoints.*`;
  }

  if (lower.includes('rate limit') || lower.includes('api key') || lower.includes('limit')) {
    return `### Recommended SaaS API Rate Limiting Architecture

- **Token Bucket Algorithm**: Excellent for allowing short bursts of high throughput while keeping steady-state consumption bounded.
- **Tier-Based Limits**:
  - **Free Tier**: 60 requests/minute, 1,000 requests/month.
  - **Pro Tier**: 600 requests/minute, 250,000 requests/month.
  - **Enterprise Tier**: Custom throughput (e.g. 5,000 req/min) with dedicated latency SLAs.
- **Headers to Return**:
  - \`X-RateLimit-Limit: 600\`
  - \`X-RateLimit-Remaining: 582\`
  - \`X-RateLimit-Reset: 1718000000\``;
  }

  if (lower.includes('release') || lower.includes('changelog') || lower.includes('announcement')) {
    return `## 🚀 What's New in v1.2.0

We're excited to ship our latest update with enhanced developer productivity and automated billing!

### Highlights
- **AI Co-Pilot Integration**: Instant assistance for SQL queries, schema design, and SaaS operations directly within your dashboard.
- **Smart Quota Management**: Real-time visualization of monthly API usage and active team seats.
- **Enhanced Stripe Sandbox**: Seamless testing of subscription upgrades without requiring production credentials.

### Improvements & Fixes
- Hardened CSRF session validation for cross-origin and embedded iframe previews.
- Faster cold-start database queries with prepared statement caching.`;
  }

  return `I have analyzed your request regarding **"${userPrompt.slice(0, 50)}${userPrompt.length > 50 ? '...' : ''}"**.

Here are three key recommendations:
1. **Modular Architecture**: Keep server actions and API routes strictly decoupled from view components for seamless maintenance.
2. **Telemetry & Observability**: Log usage metrics alongside user IDs to make informed capacity planning decisions.
3. **Graceful Degradation**: Always provide fallbacks for external dependencies so your application stays responsive even during third-party API latency.

Let me know if you would like me to generate code snippets or step-by-step implementation details!`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      messages = [],
      model = 'gpt-4o-mini',
      systemPromptPreset = 'saas-copilot',
      customSystemPrompt = '',
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const isLive = isOpenAIConfigured();
    const selectedPreset = SYSTEM_PROMPT_PRESETS.find((p) => p.id === systemPromptPreset);
    const systemPrompt = customSystemPrompt || selectedPreset?.prompt || SYSTEM_PROMPT_PRESETS[0].prompt;

    if (isLive) {
      const openai = getOpenAI()!;
      
      const formattedMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const completion = await openai.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content || 'No response generated.';

      return NextResponse.json({
        content: responseText,
        model: completion.model || model,
        isMock: false,
        usage: completion.usage,
      });
    } else {
      // Simulation / developer preview mode when OPENAI_API_KEY is not yet populated
      const lastUserMessage = [...messages].reverse().find((m: ChatMessage) => m.role === 'user');
      const userText = lastUserMessage?.content || 'Hello';
      const simulatedText = generateSimulatedResponse(userText, systemPromptPreset);

      return NextResponse.json({
        content: simulatedText,
        model: `${model} (Preview Mode)`,
        isMock: true,
        notice:
          'OPENAI_API_KEY is not set in your environment. Running in developer preview mode with contextual simulated responses. Configure OPENAI_API_KEY in your settings to connect to live OpenAI models.',
      });
    }
  } catch (error: any) {
    console.error('[api/ai/chat] Error generating chat completion:', error);

    // Provide helpful user-facing errors for common OpenAI exceptions
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API Key. Please verify your OPENAI_API_KEY.' },
        { status: 401 }
      );
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI rate limit or quota exceeded. Check your OpenAI billing plan.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || 'An error occurred while generating a response.' },
      { status: 500 }
    );
  }
}
