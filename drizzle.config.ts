import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: '.data/nessebar.db',
  },
  out: './server/db/migrations',
})
