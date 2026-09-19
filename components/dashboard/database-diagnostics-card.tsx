'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Copy, Check, Server, Zap } from 'lucide-react';

interface DiagnosticsData {
  driver: 'sqlite' | 'postgres';
  status: 'connected' | 'error';
  latencyMs: number;
  databaseUrl: string;
  isPostgres: boolean;
  counts: {
    users: number;
    subscriptions: number;
    activityLogs: number;
    apiKeys: number;
  };
  error?: string | null;
}

export function DatabaseDiagnosticsCard() {
  const [data, setData] = React.useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/db/status');
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const copyConfig = () => {
    const text = `# Neon Postgres Switch in .env.local:\nDATABASE_DRIVER="postgres"\nDATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"\n\n# Push schemas:\nnpm run db:push`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="shadow-2xs border-neutral-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database className="w-4 h-4 text-neutral-600" />
              <span>Database Architecture &amp; Neon Switcher</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Live connection telemetry and dual-dialect Drizzle ORM configuration
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="text-xs h-8 px-2.5 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {loading && !data ? (
          <div className="p-4 text-center text-neutral-400">Pinging active database driver...</div>
        ) : data ? (
          <>
            {/* Status & Latency Metric Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Active Driver
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs uppercase ${
                      data.driver === 'postgres'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {data.driver}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Status
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                  {data.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Error</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Ping Latency
                </span>
                <div className="flex items-center gap-1 font-semibold text-neutral-900 font-mono">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{data.latencyMs}ms</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                  Total Records
                </span>
                <span className="font-semibold text-neutral-900 font-mono">
                  {data.counts.users + data.counts.subscriptions + data.counts.activityLogs} entities
                </span>
              </div>
            </div>

            {/* Connection URL */}
            <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-700 block">
                Resolved Connection Target:
              </span>
              <code className="text-[11px] font-mono text-neutral-600 break-all block bg-neutral-50 p-2 rounded border border-neutral-100">
                {data.databaseUrl || 'file:data/saas.db'}
              </code>
            </div>

            {/* Neon Quickswitch Instructions */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-900 text-neutral-100 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-xs text-white">
                    Switch to Neon Serverless Postgres in Production
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyConfig}
                  className="h-7 text-neutral-300 hover:text-white hover:bg-neutral-800 text-[11px] flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Drizzle ORM is architected with dual schemas. Set these environment variables in your deployment settings or <code>.env.local</code> to route queries to Neon without changing any application code:
              </p>

              <div className="bg-black/60 p-3 rounded-lg font-mono text-[11px] text-neutral-300 space-y-1">
                <div><span className="text-neutral-500"># 1. Update environment</span></div>
                <div>DATABASE_DRIVER=<span className="text-emerald-400">&quot;postgres&quot;</span></div>
                <div>DATABASE_URL=<span className="text-emerald-400">&quot;postgresql://...neon.tech/neondb?sslmode=require&quot;</span></div>
                <div className="pt-2"><span className="text-neutral-500"># 2. Push schemas</span></div>
                <div>npm run db:push</div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
            Failed to query database diagnostics.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
