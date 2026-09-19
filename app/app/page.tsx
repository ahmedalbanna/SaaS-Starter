import { auth } from '@/auth';
import { getSubscriptionByUserId, getActivityLogs } from '@/lib/db';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  TrendingUp,
  CreditCard,
  Key,
  Users,
  Activity,
  ArrowUpRight,
  Database,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id || '';
  const subscription = userId ? await getSubscriptionByUserId(userId) : null;
  const activities = userId ? await getActivityLogs(userId, 6) : [];

  const planId = subscription?.planId || 'free';
  const isPro = planId === 'pro' || planId === 'enterprise';

  const isPostgres = 
    process.env.DATABASE_DRIVER === 'postgres' || 
    Boolean(process.env.DATABASE_URL?.startsWith('postgres://') || process.env.DATABASE_URL?.startsWith('postgresql://'));

  return (
    <div className="space-y-8">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome back, {session?.user?.name || 'Developer'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Production-grade SaaS shell powered by Next.js 15, Auth.js sessions, and Drizzle ORM.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={isPro ? 'default' : 'secondary'}
            className="text-xs font-mono uppercase px-3 py-1 flex items-center gap-1.5"
          >
            {isPro && <Sparkles className="w-3 h-3 text-amber-400" />}
            <span>{planId.toUpperCase()} PLAN</span>
          </Badge>
          <Button asChild size="sm" variant="outline" className="text-xs h-8">
            <Link href="/app/billing">
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Manage Billing
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">
              Subscription Status
            </CardTitle>
            <CreditCard className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-900 capitalize">
              {subscription?.status || 'Active'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{isPro ? 'Renews automatically' : 'Free community tier'}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">
              API Requests (Monthly)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-900">14,280</div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {isPro ? '250k quota (5.7% used)' : '1k quota limit'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">
              Active Team Seats
            </CardTitle>
            <Users className="h-4 w-4 text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-900">2 / 5</div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Alex Morgan, Sarah Chen
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-neutral-500">
              Database Driver
            </CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-neutral-900 capitalize">
              {isPostgres ? 'Postgres (Neon)' : 'SQLite (Dev)'}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Drizzle schema switch ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Quick Action Cards & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Quick Actions & Architecture Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions Card */}
          <Card className="shadow-2xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-xs">
                Common operational shortcuts for your SaaS workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/app/ai-chat"
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 hover:shadow-2xs transition-all"
              >
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-md bg-neutral-800 text-white flex items-center justify-center border border-neutral-700">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">
                    AI Co-Pilot &amp; Chat
                  </h4>
                  <p className="text-[11px] text-neutral-300 leading-normal">
                    Query code, draft SQL, and automate SaaS tasks with OpenAI.
                  </p>
                </div>
                <div className="flex items-center text-[11px] font-medium text-amber-300 mt-3 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Co-Pilot</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </Link>

              <Link
                href="/pricing"
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-2xs transition-all"
              >
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-800 flex items-center justify-center border border-neutral-200">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-black">
                    Upgrade Subscription
                  </h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Test the Stripe checkout flow or inspect pricing tiers.
                  </p>
                </div>
                <div className="flex items-center text-[11px] font-medium text-neutral-700 mt-3 group-hover:translate-x-0.5 transition-transform">
                  <span>View plans</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </Link>

              <Link
                href="/app/api-keys"
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-2xs transition-all"
              >
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center border border-neutral-200">
                    <Key className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-black">
                    API Keys
                  </h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Provision ingestion tokens for backend services.
                  </p>
                </div>
                <div className="flex items-center text-[11px] font-medium text-neutral-700 mt-3 group-hover:translate-x-0.5 transition-transform">
                  <span>Manage keys</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </Link>

              <Link
                href="/app/team"
                className="group flex flex-col justify-between p-3.5 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:shadow-2xs transition-all"
              >
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-700 flex items-center justify-center border border-neutral-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900 group-hover:text-black">
                    Team Members
                  </h4>
                  <p className="text-[11px] text-neutral-500 leading-normal">
                    Invite colleagues to collaborate in Acme Workspace.
                  </p>
                </div>
                <div className="flex items-center text-[11px] font-medium text-neutral-700 mt-3 group-hover:translate-x-0.5 transition-transform">
                  <span>Manage team</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Drizzle ORM Dual-Database Switcher Guide */}
          <Card className="shadow-2xs border-neutral-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="w-4 h-4 text-neutral-700" />
                  <span>Drizzle ORM Architecture: SQLite &lt;-&gt; Postgres Switch</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {isPostgres ? 'Postgres Active' : 'SQLite Active'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Zero-config SQLite for instant local development, with seamless Neon serverless Postgres switch for production deployments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="rounded-md bg-neutral-900 p-3 text-neutral-200 font-mono text-[11px] space-y-1">
                <span className="text-neutral-400"># Switch to Neon Postgres in .env:</span>
                <div>DATABASE_DRIVER=&quot;postgres&quot;</div>
                <div>DATABASE_URL=&quot;postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require&quot;</div>
                <span className="text-neutral-400 block mt-2"># Run migrations &amp; seed:</span>
                <div>npm run db:push</div>
                <div>npm run db:seed</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 col: Real Activity Feed */}
        <div className="space-y-6">
          <Card className="shadow-2xs h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <span>Recent Activity</span>
                </CardTitle>
                <span className="text-[10px] text-neutral-400">Drizzle Audit Log</span>
              </div>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">
                  No activity events recorded yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-neutral-900 shrink-0 mt-1.5" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900 capitalize">
                          {act.action.replace(/_/g, ' ')}
                        </p>
                        {act.details && (
                          <p className="text-neutral-500 text-[11px] leading-tight">
                            {act.details}
                          </p>
                        )}
                        <span className="text-[10px] text-neutral-400 block pt-0.5">
                          {new Date(act.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
