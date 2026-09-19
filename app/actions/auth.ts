'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function loginAction(email: string, password: string, redirectTo: string = '/app') {
  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo,
    });
    return { success: true };
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password. Please check your credentials.' };
        default:
          return { error: 'Authentication failed. Please check your credentials.' };
      }
    }
    // NextAuth throws a redirect error on successful sign-in when redirectTo is passed
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    return { error: error?.message || 'Failed to sign in.' };
  }
}
