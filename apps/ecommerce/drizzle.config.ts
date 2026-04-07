import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: 'b9aac465aa71533a0342ac8da7f32813',
    databaseId: '87f1b08d-15ce-443c-bf0b-c905aa76169d',
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
