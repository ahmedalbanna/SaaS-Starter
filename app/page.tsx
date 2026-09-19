import Link from 'next/link';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ArrowRight,
  Database,
  CreditCard,
  Key,
  Lock,
  Sparkles,
  Command,
  Layers,
  Zap,
  CheckCircle2,
  Code2,
  Terminal,
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-neutral-50/60 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base">SaaS Starter</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-neutral-900 transition-colors">
              Architecture
            </a>
            <Link href="/pricing" className="hover:text-neutral-900 transition-colors">
              Pricing Plans
            </Link>
            <Link href="/app" className="hover:text-neutral-900 transition-colors">
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <Button asChild size="sm" className="text-xs font-medium">
                <Link href="/app">
                  Open Dashboard
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="text-xs font-medium">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-24 text-center px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-xs font-medium text-neutral-700 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>Next.js 15 App Router • Auth.js v5 • Drizzle ORM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.12]">
            Scaffold and scale your next SaaS product in days, not months
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            A production-ready foundation with salted bcrypt password authentication, a protected dashboard shell with command palette, SQLite-to-Postgres Drizzle data layer, and Stripe checkout simulation.
          </p>

          <div className="pt-4 flex flex-wrap justify-center items-center gap-3.5">
            <Button asChild size="lg" className="h-11 px-6 font-semibold shadow-xs">
              <Link href="/app">
                Explore Protected Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-6 font-medium">
              <Link href="/pricing">
                View Pricing &amp; Checkout
              </Link>
            </Button>
          </div>

          {/* Quick Demo Credentials pill */}
          <div className="pt-3">
            <p className="text-xs text-neutral-500">
              Demo account ready:{' '}
              <code className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded font-mono text-neutral-800">
                demo@saas-starter.dev
              </code>{' '}
              / password:{' '}
              <code className="bg-white border border-neutral-200 px-1.5 py-0.5 rounded font-mono text-neutral-800">
                password123
              </code>
            </p>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Engineered For Speed
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
            Every core SaaS primitive, pre-wired and battle-tested
          </h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            Avoid wrestling with boilerplate. Start with clean schemas, secure sessions, and extensible UI primitives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Auth.js */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Email + Password Auth (Auth.js)
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Implemented with NextAuth v5 credentials provider. Passwords are salted with bcrypt (10 rounds) and verified against Drizzle ORM before issuing encrypted 30-day JWT sessions.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Stateless &amp; edge compatible</span>
            </div>
          </div>

          {/* Card 2: Command Palette Dashboard */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <Command className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Protected Shell &amp; Command Palette
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Keyboard-first navigation with <code>Cmd+K</code> / <code>Ctrl+K</code> command palette powered by <code>cmdk</code>. Features a responsive collapsible sidebar, breadcrumbs, and live user context.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full keyboard navigation</span>
            </div>
          </div>

          {/* Card 3: Drizzle Dual Switch */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Drizzle ORM (SQLite &amp; Neon Postgres)
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Zero-setup SQLite for rapid offline development, paired with a single <code>DATABASE_DRIVER=&quot;postgres&quot;</code> switch to connect to Neon Serverless Postgres in production.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Includes migrations &amp; seed script</span>
            </div>
          </div>

          {/* Card 4: Stripe Checkout */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Stripe Billing with Sandbox Stub
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Three-tier pricing with monthly/annual intervals. When Stripe secret keys are omitted, an interactive stub allows full UI checkout testing without waiting for Stripe account approval.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Customer portal &amp; webhooks</span>
            </div>
          </div>

          {/* Card 5: Ingestion API Keys */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <Key className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              API Tokens &amp; Audit Logging
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Allow customers to provision high-entropy SHA256 hashed secret keys for webhooks and CLI integrations. Track critical mutations in an indexed activity audit trail.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>One-time secret reveals</span>
            </div>
          </div>

          {/* Card 6: shadcn/ui & Tailwind v4 */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800 border border-neutral-200">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Tailwind CSS v4 &amp; shadcn/ui
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Modern zero-config styling powered by PostCSS `@tailwindcss/postcss` and accessible primitives. Clean neutral monochrome palette with high optical contrast.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>Accessible &amp; customizable</span>
            </div>
          </div>
        </div>
      </section>

      {/* Code & Architecture Showcase */}
      <section id="architecture" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-10 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge variant="outline" className="border-neutral-700 text-neutral-300 text-xs">
                Zero Configuration Switching
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Dual-Dialect Drizzle ORM Architecture
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                Develop with zero friction using an embedded SQLite database. When deploying to production, point your connection string to Neon or Supabase and flip one environment variable.
              </p>
              <div className="pt-2 space-y-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Typed User &amp; Subscription schemas with foreign key cascades</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Seeded with admin user and sample Pro subscription tier</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>drizzle-kit migration generation and schema push ready</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 font-mono text-xs text-neutral-200 overflow-x-auto space-y-2 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>terminal</span>
                </div>
                <span>npm scripts</span>
              </div>
              <p className="text-neutral-500"># 1. Run local dev with embedded SQLite</p>
              <p className="text-emerald-400">npm run dev</p>
              <p className="text-neutral-500 pt-2"># 2. Seed default admin &amp; pro subscription</p>
              <p className="text-emerald-400">npm run db:seed</p>
              <p className="text-neutral-500 pt-2"># 3. Push schema to production Neon database</p>
              <p className="text-emerald-400">npm run db:push</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center space-y-6">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
          Ready to inspect the live dashboard?
        </h2>
        <p className="text-sm text-neutral-600 max-w-lg mx-auto">
          Explore the authenticated workspace shell, test the command palette shortcuts, and simulate subscription upgrades.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button asChild size="lg" className="font-semibold">
            <Link href="/app">
              Launch App Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">Explore Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8 text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-700" />
            <span className="font-semibold text-neutral-900">SaaS Starter</span>
            <span>• Next.js 15, Auth.js, Drizzle ORM, Stripe, shadcn/ui</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-neutral-900">
              Pricing
            </Link>
            <Link href="/app" className="hover:text-neutral-900">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-neutral-900">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
