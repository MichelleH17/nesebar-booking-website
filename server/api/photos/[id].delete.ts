import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { photos } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID fotky.' })
  }

  const db = useDb()
  const existing = await db.select().from(photos).where(eq(photos.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Fotka nenalezena.' })
  }

  await db.delete(photos).where(eq(photos.id, id)).run()

  await deleteUploadedImage(existing.url)

  return { success: true }
})
