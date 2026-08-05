import { drizzle } from 'drizzle-orm/libsql/node'
import { createClient } from '@libsql/client/node'
import { mkdirSync } from 'node:fs'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL
    if (!url) {
      // The local-file fallback can't work on a serverless read-only FS — fail loudly
      // instead of an opaque EROFS on every route.
      if (process.env.VERCEL || process.env.NETLIFY) {
        throw new Error('TURSO_DATABASE_URL is required in production.')
      }
      mkdirSync('.data', { recursive: true })
    }
    _db = drizzle(
      createClient({
        url: url ?? 'file:.data/nessebar.db',
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
      { schema },
    )
  }
  return _db
}

export type Db = ReturnType<typeof useDb>
/** Accepts either the db or a transaction handle, for helpers used both ways. */
export type DbOrTx = Db | Parameters<Parameters<Db['transaction']>[0]>[0]
