import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/db/schemas/index.ts',
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ecredit_dev',
  },
  out: './src/infrastructure/db/migrations',
});
