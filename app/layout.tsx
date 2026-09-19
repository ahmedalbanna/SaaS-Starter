import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'SaaS Starter - Production-Grade Next.js Template',
  description: 'Production-grade SaaS starter with Next.js App Router, Auth.js email+password authentication, protected app dashboard, Stripe checkout, and Drizzle ORM data layer.',
  openGraph: {
    title: 'SaaS Starter - Production-Grade Next.js Template',
    description: 'Production-grade SaaS starter with Next.js App Router, Auth.js email+password authentication, protected app dashboard, Stripe checkout, and Drizzle ORM data layer.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaaS Starter - Production-Grade Next.js Template',
    description: 'Production-grade SaaS starter with Next.js App Router, Auth.js email+password authentication, protected app dashboard, Stripe checkout, and Drizzle ORM data layer.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="min-h-screen bg-neutral-50 text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

