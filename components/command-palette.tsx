'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Key,
  Settings,
  DollarSign,
  Home,
  LogOut,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Building2,
  Check,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useOptionalWorkspace } from '@/components/providers/workspace-provider';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const workspaceContext = useOptionalWorkspace();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div
      id="command-palette-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs p-4 pt-[15vh] sm:pt-[20vh] animate-in fade-in-0"
      onClick={() => onOpenChange(false)}
    >
      <div
        id="command-palette-modal"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-xl border-none">
          <CommandInput placeholder="Type a command or search..." autoFocus />
          <CommandList className="max-h-[350px]">
            <CommandEmpty>No results found.</CommandEmpty>

            {workspaceContext && workspaceContext.workspaces.length > 0 && (
              <>
                <CommandGroup heading="Switch Workspace">
                  {workspaceContext.workspaces.map((ws) => {
                    const isActive = ws.id === workspaceContext.currentWorkspace?.id;
                    return (
                      <CommandItem
                        key={ws.id}
                        onSelect={() =>
                          runCommand(() => {
                            workspaceContext.switchWorkspace(ws.id);
                          })
                        }
                        className="cursor-pointer gap-2"
                      >
                        <Building2 className="h-4 w-4 text-neutral-500" />
                        <span className="flex-1 truncate">{ws.name}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-800">
                          {ws.userRole}
                        </span>
                        {isActive && <Check className="h-3.5 w-3.5 text-emerald-600 ml-1" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="Navigation">
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app'))}
                className="cursor-pointer gap-2"
              >
                <LayoutDashboard className="h-4 w-4 text-neutral-500" />
                <span>Dashboard Overview</span>
                <CommandShortcut>G D</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/billing'))}
                className="cursor-pointer gap-2"
              >
                <CreditCard className="h-4 w-4 text-neutral-500" />
                <span>Subscriptions & Billing</span>
                <CommandShortcut>G B</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/team'))}
                className="cursor-pointer gap-2"
              >
                <Users className="h-4 w-4 text-neutral-500" />
                <span>Team & Collaborators</span>
                <CommandShortcut>G T</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/api-keys'))}
                className="cursor-pointer gap-2"
              >
                <Key className="h-4 w-4 text-neutral-500" />
                <span>API Keys & Webhooks</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/settings'))}
                className="cursor-pointer gap-2"
              >
                <Settings className="h-4 w-4 text-neutral-500" />
                <span>Account Settings</span>
                <CommandShortcut>G S</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Public Pages">
              <CommandItem
                onSelect={() => runCommand(() => router.push('/pricing'))}
                className="cursor-pointer gap-2"
              >
                <DollarSign className="h-4 w-4 text-neutral-500" />
                <span>Pricing Plans & Comparison</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/'))}
                className="cursor-pointer gap-2"
              >
                <Home className="h-4 w-4 text-neutral-500" />
                <span>Marketing Landing Page</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/billing'))}
                className="cursor-pointer gap-2"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Stripe Webhook Simulator</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/settings'))}
                className="cursor-pointer gap-2"
              >
                <Settings className="h-4 w-4 text-neutral-500" />
                <span>Neon Postgres Diagnostics</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/api-keys'))}
                className="cursor-pointer gap-2"
              >
                <PlusCircle className="h-4 w-4 text-neutral-500" />
                <span>Generate New API Key</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => router.push('/app/team'))}
                className="cursor-pointer gap-2"
              >
                <Users className="h-4 w-4 text-neutral-500" />
                <span>Invite Workspace Teammates</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Account">
              <CommandItem
                onSelect={() => runCommand(() => signOut({ callbackUrl: '/login' }))}
                className="cursor-pointer gap-2 text-red-600 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  );
}
