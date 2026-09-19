import { defineConfig } from 'drizzle-kit';

const isPostgres = 
  process.env.DATABASE_DRIVER === 'postgres' || 
  Boolean(process.env.DATABASE_URL?.startsWith('postgres://') || process.env.DATABASE_URL?.startsWith('postgresql://'));

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: isPostgres ? 'postgresql' : 'sqlite',
  dbCredentials: isPostgres
    ? {
        url: process.env.DATABASE_URL || 'postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require',
      }
    : {
        url: process.env.DATABASE_URL || 'data/saas.db',
      },
});
