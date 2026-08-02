import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { siteTexts } from '~~/server/db/schema'
import { SITE_TEXT_DEFAULTS } from '~~/server/utils/siteTexts'

// Admin only: upsert one editable text (CS + EN).
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = getRouterParam(event, 'key')
  if (!key || !(key in SITE_TEXT_DEFAULTS)) {
    throw createError({ statusCode: 400, message: 'Neznámý textový klíč.' })
  }

  const body = await readBody(event)
  if (typeof body.valueCs !== 'string' || typeof body.valueEn !== 'string') {
    throw createError({ statusCode: 400, message: 'Chybí text (CS a EN).' })
  }
  const valueCs = body.valueCs.trim()
  const valueEn = body.valueEn.trim()

  const db = useDb()
  db.insert(siteTexts)
    .values({ key, valueCs, valueEn })
    .onConflictDoUpdate({ target: siteTexts.key, set: { valueCs, valueEn } })
    .run()

  return { key, valueCs, valueEn }
})
