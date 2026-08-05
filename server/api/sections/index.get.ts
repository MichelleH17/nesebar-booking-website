import { useDb } from '~~/server/db'
import { sectionVisibility } from '~~/server/db/schema'
import { SECTION_KEYS } from '~~/server/utils/sections'

// Public: returns { key: hidden } for every known section (default false = visible).
export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await db.select().from(sectionVisibility).all()
  const stored = new Map(rows.map(r => [r.key, r.hidden]))

  const result: Record<string, boolean> = {}
  for (const key of SECTION_KEYS) result[key] = stored.get(key) ?? false
  return result
})
