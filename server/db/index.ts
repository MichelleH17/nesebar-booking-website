import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (!_db) {
    mkdirSync('.data', { recursive: true })
    _db = drizzle(new Database('.data/nessebar.db'), { schema })
  }
  return _db
}
