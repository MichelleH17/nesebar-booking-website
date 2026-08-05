import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { sectionVisibility } from '~~/server/db/schema'
import { SECTION_KEYS } from '~~/server/utils/sections'

// Admin only: set a section's visibility.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const key = getRouterParam(event, 'key')
  if (!key || !SECTION_KEYS.includes(key as typeof SECTION_KEYS[number])) {
    throw createError({ statusCode: 400, message: 'Neznámá sekce.' })
  }

  const body = await readBody(event)
  if (typeof body.hidden !== 'boolean') {
    throw createError({ statusCode: 400, message: 'Neplatná viditelnost.' })
  }

  const db = useDb()
  await db.insert(sectionVisibility)
    .values({ key, hidden: body.hidden })
    .onConflictDoUpdate({ target: sectionVisibility.key, set: { hidden: body.hidden } })
    .run()

  return { key, hidden: body.hidden }
})
