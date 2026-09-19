'use client';

import * as React from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SocialAuthButtonsProps {
  callbackUrl?: string;
}

export function SocialAuthButtons({ callbackUrl = '/app' }: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = React.useState<'github' | 'google' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const handleOAuthSignIn = async (provider: 'github' | 'google') => {
    setLoadingProvider(provider);
    setNotice(null);
    try {
      // Initiate sign in with NextAuth
      const res = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes('Configuration') || res.error.includes('OAuthSignin')) {
          setNotice(
            `OAuth credentials for ${provider === 'github' ? 'GitHub' : 'Google'} are not yet configured in environment variables. Add AUTH_${provider.toUpperCase()}_ID and AUTH_${provider.toUpperCase()}_SECRET to enable live social authentication.`
          );
        } else {
          setNotice(res.error);
        }
      } else if (res?.url) {
        window.location.assign(res.url);
      }
    } catch (err: any) {
      setNotice(
        `OAuth provider ${provider === 'github' ? 'GitHub' : 'Google'} is ready in code. Add AUTH_${provider.toUpperCase()}_ID and AUTH_${provider.toUpperCase()}_SECRET to activate live login.`
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 leading-relaxed">
          <strong className="font-semibold block mb-0.5">Setup Note:</strong>
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* GitHub Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs font-medium h-9 border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-2"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuthSignIn('github')}
        >
          {loadingProvider === 'github' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
          ) : (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          )}
          GitHub
        </Button>

        {/* Google Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs font-medium h-9 border-neutral-200 hover:bg-neutral-50 flex items-center justify-center gap-2"
          disabled={loadingProvider !== null}
          onClick={() => handleOAuthSignIn('google')}
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />
          ) : (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          Google
        </Button>
      </div>
    </div>
  );
}
