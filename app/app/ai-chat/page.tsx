'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Code2,
  Database,
  CreditCard,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  isMock?: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: Database,
    title: 'SQL MRR Query',
    prompt: 'Write an optimized SQL query to calculate Monthly Recurring Revenue (MRR) by active subscription tier.',
  },
  {
    icon: CreditCard,
    title: 'Stripe Webhook Handler',
    prompt: 'How do I securely verify Stripe webhook signatures and handle invoice.payment_succeeded in Next.js?',
  },
  {
    icon: Code2,
    title: 'API Rate Limiting',
    prompt: 'Recommend an API rate limiting strategy and header structure for our Free vs Pro plan tiers.',
  },
  {
    icon: FileText,
    title: 'Release Notes v1.2',
    prompt: 'Draft an engaging product changelog announcement for our v1.2 release highlighting AI Co-Pilot and billing controls.',
  },
];

let msgSequence = 0;
function createMsgId(prefix: string): string {
  msgSequence += 1;
  return `${prefix}-${msgSequence}`;
}

function getFormattedTime(): string {
  const d = new Date();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function AIChatPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'Hello! I am your SaaS Co-Pilot powered by OpenAI. I can help you draft SQL queries, optimize Stripe billing logic, architect API endpoints, or write product documentation. What are we building today?',
      timestamp: 'Just now',
      model: 'gpt-4o-mini',
      isMock: false,
    },
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState('gpt-4o-mini');
  const [selectedPreset, setSelectedPreset] = React.useState('saas-copilot');
  const [statusData, setStatusData] = React.useState<{
    configured: boolean;
    models: Array<{ id: string; name: string; description: string; recommended: boolean }>;
    presets: Array<{ id: string; title: string; prompt: string }>;
  } | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Fetch status on load
  React.useEffect(() => {
    let active = true;
    fetch('/api/ai/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setStatusData(data);
        }
      })
      .catch((err) => console.error('Failed to load AI status', err));

    return () => {
      active = false;
    };
  }, []);

  // Auto-scroll when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: createMsgId('welcome'),
        role: 'assistant',
        content:
          'Chat history cleared. Select a prompt below or type your technical inquiry to begin.',
        timestamp: 'Just now',
        model: selectedModel,
      },
    ]);
  };

  const handleExportChat = () => {
    const formatted = messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? '👤 User' : '🤖 Assistant'} (${m.timestamp})\n\n${m.content}\n\n---\n`
      )
      .join('\n');

    const blob = new Blob([formatted], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saas-copilot-chat.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: createMsgId('user'),
      role: 'user',
      content: query,
      timestamp: getFormattedTime(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel,
          systemPromptPreset: selectedPreset,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate response.');
      }

      const assistantMessage: Message = {
        id: createMsgId('assistant'),
        role: 'assistant',
        content: data.content,
        timestamp: getFormattedTime(),
        model: data.model || selectedModel,
        isMock: data.isMock,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: createMsgId('err'),
        role: 'assistant',
        content: `⚠️ Error: ${err?.message || 'Could not communicate with OpenAI service. Please check your credentials.'}`,
        timestamp: getFormattedTime(),
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple formatter for assistant responses with basic code blocks & bullet points
  const renderMessageContent = (text: string) => {
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const precedingText = text.substring(lastIndex, match.index);
      if (precedingText) {
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {precedingText}
          </div>
        );
      }

      const lang = match[1] || 'code';
      const code = match[2];
      const codeId = `code-${match.index}`;

      parts.push(
        <div
          key={codeId}
          className="my-3 rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden font-mono text-xs text-neutral-200"
        >
          <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[11px] text-neutral-400">
            <span className="uppercase">{lang}</span>
            <button
              onClick={() => handleCopy(code, codeId)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              {copiedId === codeId ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <div key={`text-final`} className="whitespace-pre-wrap leading-relaxed">
          {remainingText}
        </div>
      );
    }

    return parts;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="pb-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">AI Co-Pilot &amp; Chat</h1>
            <Badge
              variant="outline"
              className={
                statusData?.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 font-mono text-[11px]'
                  : 'bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 font-mono text-[11px]'
              }
            >
              {statusData?.configured ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  OpenAI Live
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Developer Preview Mode
                </>
              )}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Query architecture designs, generate SQL queries, or draft technical copy with OpenAI models.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs h-8 gap-1.5 text-neutral-600"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Options</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportChat}
            className="text-xs h-8 gap-1.5 text-neutral-600"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-xs h-8 gap-1.5 text-neutral-600 hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>
      </div>

      {/* Model & Persona Controls Drawer/Bar */}
      {showSettings && (
        <div className="py-3 px-4 bg-neutral-100/70 border-b border-neutral-200 rounded-lg my-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">OpenAI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-neutral-800 focus:ring-1 focus:ring-neutral-900"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Fast &amp; Recommended)</option>
              <option value="gpt-4o">GPT-4o (Flagship Omni)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Assistant Persona</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="w-full rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-neutral-800 focus:ring-1 focus:ring-neutral-900"
            >
              <option value="saas-copilot">SaaS Co-Pilot (Architecture &amp; Strategy)</option>
              <option value="code-architect">Code &amp; SQL Architect (Full-Stack Dev)</option>
              <option value="growth-marketing">Growth &amp; Copywriting (Marketing &amp; Docs)</option>
              <option value="customer-support">Support Specialist (Customer Success)</option>
            </select>
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold ${
                  isUser
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-800 border border-neutral-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 shadow-xs text-sm ${
                  isUser
                    ? 'bg-neutral-900 text-white rounded-tr-xs'
                    : 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 text-[11px] text-neutral-500">
                    <span className="font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {msg.model || selectedModel}
                      {msg.isMock && (
                        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded font-sans">
                          simulated
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="hover:text-neutral-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                <div className="text-[13.5px]">{renderMessageContent(msg.content)}</div>

                <div
                  className={`mt-2 text-[10px] ${
                    isUser ? 'text-neutral-400 text-right' : 'text-neutral-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-200 text-neutral-800 border border-neutral-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 bg-white border border-neutral-200 rounded-xl rounded-tl-xs shadow-xs text-sm text-neutral-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
              <span>Generating response with {selectedModel}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips (when few messages) */}
      {messages.length <= 2 && (
        <div className="py-2">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Suggested Queries
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-left transition-all cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0 mt-0.5 group-hover:bg-neutral-200">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900">{item.title}</div>
                    <div className="text-[11px] text-neutral-500 line-clamp-1">{item.prompt}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="pt-2 border-t border-neutral-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative rounded-xl border border-neutral-300 bg-white shadow-xs focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your SaaS Co-Pilot anything (e.g., 'Draft a SQL migration for team invites' or 'Explain Stripe webhooks')..."
            rows={2}
            className="w-full resize-none bg-transparent px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <span>Press</span>
              <kbd className="px-1 py-0.5 rounded bg-neutral-200 text-neutral-700 font-mono text-[10px]">
                Enter ↵
              </kbd>
              <span>to send,</span>
              <kbd className="px-1 py-0.5 rounded bg-neutral-200 text-neutral-700 font-mono text-[10px]">
                Shift + Enter
              </kbd>
              <span>for new line</span>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading}
              className="h-8 gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs px-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
