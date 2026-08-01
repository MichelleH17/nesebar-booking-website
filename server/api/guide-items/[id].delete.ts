import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { guideItems } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID položky.' })
  }

  const db = useDb()
  const existing = db.select().from(guideItems).where(eq(guideItems.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Položka nenalezena.' })
  }

  db.delete(guideItems).where(eq(guideItems.id, id)).run()
  return { success: true }
})
