import { useDb } from '~~/server/db'
import { siteTexts } from '~~/server/db/schema'
import { SITE_TEXT_DEFAULTS } from '~~/server/utils/siteTexts'

// Public: returns every known text as { key: { cs, en } }, stored overrides merged over defaults.
export default defineEventHandler(() => {
  const db = useDb()
  const rows = db.select().from(siteTexts).all()
  const stored = new Map(rows.map(r => [r.key, r]))

  const result: Record<string, { cs: string; en: string }> = {}
  for (const [key, def] of Object.entries(SITE_TEXT_DEFAULTS)) {
    const row = stored.get(key)
    result[key] = {
      cs: row?.valueCs?.trim() ? row.valueCs : def.cs,
      en: row?.valueEn?.trim() ? row.valueEn : def.en,
    }
  }
  return result
})
