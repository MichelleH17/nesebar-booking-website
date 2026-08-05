import { defineConfig } from 'drizzle-kit'
import { mkdirSync } from 'node:fs'

// The libSQL client opens but never creates the directory for a local file DB.
if (!process.env.TURSO_DATABASE_URL) mkdirSync('.data', { recursive: true })

export default defineConfig({
  dialect: 'turso',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? 'file:.data/nessebar.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  out: './server/db/migrations',
})
