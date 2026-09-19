'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommandPalette } from '@/components/command-palette';
import { WorkspaceSwitcher } from '@/components/dashboard/workspace-switcher';
import { useWorkspace } from '@/components/providers/workspace-provider';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Key,
  Settings,
  Search,
  LogOut,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  DollarSign,
  Bell,
  Database,
  Building2,
} from 'lucide-react';

interface DashboardShellProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  subscription?: {
    planId: 'free' | 'pro' | 'enterprise';
    status: string;
  } | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, subscription, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { currentWorkspace } = useWorkspace();

  const planId = currentWorkspace?.plan || subscription?.planId || 'free';
  const planLabel = planId.toUpperCase();

  const navItems = [
    {
      name: 'Overview',
      href: '/app',
      icon: LayoutDashboard,
      current: pathname === '/app',
    },
    {
      name: 'AI Co-Pilot',
      href: '/app/ai-chat',
      icon: Sparkles,
      current: pathname.startsWith('/app/ai-chat'),
      badge: 'OpenAI',
    },
    {
      name: 'Subscriptions & Billing',
      href: '/app/billing',
      icon: CreditCard,
      current: pathname.startsWith('/app/billing'),
    },
    {
      name: 'Team & Members',
      href: '/app/team',
      icon: Users,
      current: pathname.startsWith('/app/team'),
    },
    {
      name: 'API Keys',
      href: '/app/api-keys',
      icon: Key,
      current: pathname.startsWith('/app/api-keys'),
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: Settings,
      current: pathname.startsWith('/app/settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col md:flex-row">
      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sticky top-0 z-30">
        <Link href="/app" className="flex items-center gap-2 font-semibold text-sm">
          <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>SaaS Starter</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCommandOpen(true)}
            className="h-8 px-2.5 text-xs text-neutral-500"
          >
            <Search className="w-3.5 h-3.5 mr-1" />
            <span>⌘K</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-white p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="px-1">
              <WorkspaceSwitcher />
            </div>
            <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Navigation
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between px-2">
              <div>
                <div className="text-xs font-semibold text-neutral-900">{user.name || user.email}</div>
                <div className="text-[11px] text-neutral-500">{user.email}</div>
              </div>
              <Badge variant={planId === 'pro' ? 'default' : 'secondary'} className="text-[10px]">
                {planLabel}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-red-600 justify-center"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r border-neutral-200 bg-white p-4 shrink-0 min-h-screen sticky top-0 h-screen">
        <div className="space-y-5">
          {/* Logo & Workspace Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-neutral-900">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm leading-none font-semibold">SaaS Starter</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">Production Template</span>
                </div>
              </Link>
            </div>
            <WorkspaceSwitcher />
          </div>

          {/* Quick Search / Command Palette Bar */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50/70 text-xs text-neutral-500 hover:bg-neutral-100/80 hover:border-neutral-300 transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Quick search...</span>
            </div>
            <kbd className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          {/* Main Navigation Links */}
          <nav className="space-y-1">
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Menu
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  item.current
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}
                {item.href === '/app/billing' && planId === 'pro' && (
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
                )}
              </Link>
            ))}
          </nav>

          {/* Plan Status Widget */}
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Active Plan
              </span>
              <Badge
                variant={planId === 'pro' ? 'default' : 'secondary'}
                className="text-[10px] py-0 px-2 uppercase font-mono"
              >
                {planLabel}
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {planId === 'pro'
                ? 'Unlimited projects, webhooks, and team collaborators active.'
                : 'Free tier with SQLite local dev. Upgrade for team seats and Stripe portal.'}
            </p>
            {planId !== 'pro' && (
              <Button asChild size="sm" variant="default" className="w-full text-xs h-7">
                <Link href="/pricing" className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Upgrade to Pro</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="border-t border-neutral-200 pt-3 mt-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-medium text-xs flex items-center justify-center shrink-0">
                {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-neutral-900 truncate">
                  {user.name || 'Account'}
                </div>
                <div className="text-[11px] text-neutral-400 truncate">
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Sign Out"
              className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-md hover:bg-neutral-100"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="hidden md:flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
              <Building2 className="w-3.5 h-3.5 text-neutral-500" />
              {currentWorkspace?.name || 'Workspace'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-700 capitalize">
              {pathname === '/app' ? 'Overview' : pathname.replace('/app/', '').replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-md transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Command Menu</span>
              <kbd className="rounded border border-neutral-300 bg-white px-1 py-0.2 text-[10px] font-mono">
                ⌘K
              </kbd>
            </button>

            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href="/pricing">
                <DollarSign className="w-3.5 h-3.5 mr-1" />
                Pricing
              </Link>
            </Button>
          </div>
        </header>

        {/* Dynamic Page Children */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
