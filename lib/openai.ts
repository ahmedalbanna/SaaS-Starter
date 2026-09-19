import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '');
}

export function getOpenAI(): OpenAI | null {
  if (!isOpenAIConfigured()) {
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openaiClient;
}

export const OPENAI_MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast, lightweight, and cost-effective for general assistant tasks',
    recommended: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Flagship omni model with advanced reasoning and coding capabilities',
    recommended: false,
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Legacy reliable model for simple prompts and high-volume tasks',
    recommended: false,
  },
];

export const SYSTEM_PROMPT_PRESETS = [
  {
    id: 'saas-copilot',
    title: 'SaaS Co-Pilot',
    prompt:
      'You are an expert SaaS technical advisor and product co-pilot embedded within the dashboard. You assist with technical architecture, database schemas, API design, Stripe billing strategies, and scaling modern web applications.',
  },
  {
    id: 'code-architect',
    title: 'Code & SQL Architect',
    prompt:
      'You are a senior full-stack software engineer and database expert. Provide concise, clean TypeScript, Next.js, and SQL solutions with explanations and best practices.',
  },
  {
    id: 'growth-marketing',
    title: 'Growth & Copywriting',
    prompt:
      'You are a B2B SaaS growth marketer. You write compelling product changelogs, onboarding email sequences, landing page copy, and value proposition messaging.',
  },
  {
    id: 'customer-support',
    title: 'Support Specialist',
    prompt:
      'You are a courteous, empathetic customer success manager helping SaaS users troubleshoot account settings, subscription tiers, and API integration questions.',
  },
];
