# SaaS Starter — Production-Grade Next.js 15 Starter

A production-grade, type-safe SaaS application template built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, **Auth.js v5 (NextAuth)**, **Drizzle ORM** (dual SQLite dev / Neon Postgres prod), and **Stripe Subscriptions** with an interactive dev stub.

---

## Features

- **Authentication & Sessions**: Email + password credentials authentication with `bcryptjs` salted password hashing, password reset flow (`/forgot-password`, `/reset-password`), optional Social OAuth providers (**GitHub** & **Google**), and secure stateless JWT sessions managed by **Auth.js (NextAuth v5)**.
- **Protected Dashboard Shell**: Full-featured `/app` workspace with a responsive sidebar, user profile selector, live metrics, activity audit log, team manager with email invitations, and API keys panel.
- **Spotlight Command Palette**: Global `Cmd+K` / `Ctrl+K` keyboard-first command palette built with `cmdk` for fast route navigation and actions.
- **Stripe Billing & Webhook Simulator**: Three-tier pricing (`Starter`, `Pro`, `Enterprise`) with monthly/annual intervals, an interactive dev stub mode, and a **Stripe Webhook Event Simulator** directly in `/app/billing` to test real database tier updates without the Stripe CLI.
- **Transactional Emails (Resend + Dev Outbox)**: Modular email client (`lib/email.ts`) with prebuilt templates for welcome emails, password resets, and team invitations. Includes an in-app dev outbox inspector.
- **Dual-Dialect Drizzle ORM & Neon Diagnostics**: Zero-config SQLite via `@libsql/client` for fast offline development, and an in-app Database Diagnostics & Neon Switcher panel in `/app/settings` with automated telemetry and 1-variable switch (`DATABASE_DRIVER="postgres"`).
- **Database Migrations & Seed**: Run `npm run db:seed` to provision demo users, sample active Pro subscriptions, activity trails, and API tokens.
- **Modern UI & Design System**: Crafted with Tailwind CSS v4, `@tailwindcss/postcss`, Lucide icons, and shadcn/ui components.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15 (App Router)](https://nextjs.org/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + `@tailwindcss/postcss` |
| UI Primitives | [shadcn/ui](https://ui.shadcn.com/) + [cmdk](https://cmdk.paco.me/) |
| Authentication | [Auth.js v5 (NextAuth.js)](https://authjs.dev/) + [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| ORM & Database | [Drizzle ORM](https://orm.drizzle.team/) (SQLite / Neon Postgres) |
| Payments | [Stripe SDK](https://stripe.com/) (Checkout & Customer Portal) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Default dev values are pre-configured:
```env
AUTH_SECRET="dev-insecure-auth-secret-change-in-production-min-32-chars"
DATABASE_DRIVER="sqlite"
DATABASE_URL="file:data/saas.db"
```

### 3. Seed the Database
Populate the local SQLite database with default demo accounts and a Pro subscription:
```bash
npm run db:seed
```

This creates:
- **Admin Demo User**: `demo@saas-starter.dev` / Password: `password123` (Pro plan active)
- **Standard User**: `sarah@company.io` / Password: `password123` (Free plan)

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Architecture & Dialect Switch

### Development (SQLite)
By default, the starter writes to `./data/saas.db` via `@libsql/client`, requiring zero local database server installation.

### Production (Neon Serverless Postgres)
To connect to Neon or any Postgres instance:
1. Open `.env.local`
2. Set:
```env
DATABASE_DRIVER="postgres"
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
3. Push schemas to Postgres:
```bash
npm run db:push
npm run db:seed
```

---

## Stripe Configuration & Stub Mode

### Stub Mode (Default when keys are unset)
When `STRIPE_SECRET_KEY` is not defined:
- The `/pricing` checkout calls trigger dev stub mode.
- Plans upgrade automatically in the local database.
- You can test Pro UI states immediately without entering card numbers.

### Live Mode
Add your Stripe keys in `.env.local`:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

---

## Available Scripts

- `npm run dev`: Launch development server on port 3000
- `npm run build`: Build production Next.js application
- `npm run start`: Run production server
- `npm run lint`: Run ESLint checks
- `npm run db:seed`: Seed users, subscriptions, activity logs, and API keys
- `npm run db:push`: Push Drizzle schema changes to current database
- `npm run db:generate`: Generate SQL migration files in `./drizzle/migrations`
- `npm run db:studio`: Launch Drizzle Studio web inspector

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/            # Auth.js route handlers & registration API
│   │   ├── keys/            # API key CRUD endpoints
│   │   └── stripe/          # Checkout, Customer Portal & Webhook handlers
│   ├── app/                 # Protected SaaS workspace shell
│   │   ├── api-keys/        # Ingestion token management
│   │   ├── billing/         # Subscription switcher & Stripe portal
│   │   ├── settings/        # Account & security parameters
│   │   ├── team/            # Collaborator management
│   │   ├── layout.tsx       # Protected layout with auth guard & sidebar
│   │   └── page.tsx         # Dashboard overview with live metrics
│   ├── login/               # Sign-in page with 1-click demo button
│   ├── register/            # User onboarding with automatic sign-in
│   ├── pricing/             # 3-tier pricing table & checkout trigger
│   ├── globals.css          # Tailwind CSS v4 entry point
│   ├── layout.tsx           # Root HTML layout with SessionProvider
│   └── page.tsx             # Marketing landing page
├── components/
│   ├── dashboard/           # Sidebar & topbar navigation shell
│   ├── ui/                  # shadcn/ui components (Button, Card, Input, etc.)
│   ├── command-palette.tsx  # Cmd+K global search modal
│   └── providers/           # NextAuth SessionProvider wrapper
├── lib/
│   ├── db/
│   │   ├── index.ts         # Dual SQLite / Postgres query client
│   │   ├── schema.ts        # Drizzle ORM User & Subscription schemas
│   │   └── types.ts         # TypeScript model interfaces
│   ├── stripe.ts            # Stripe SDK lazy client & plan metadata
│   └── utils.ts             # Tailwind class merging (cn helper)
├── scripts/
│   └── seed.ts              # Database seeder script
├── auth.ts                  # Auth.js v5 credentials configuration
├── drizzle.config.ts        # Drizzle Kit migration configuration
└── .env.example             # Documented environment variables template
```
