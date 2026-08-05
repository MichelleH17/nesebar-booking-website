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
  const existing = await db.select().from(guideItems).where(eq(guideItems.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Položka nenalezena.' })
  }

  await db.delete(guideItems).where(eq(guideItems.id, id)).run()
  // Blob URLs are unique per upload, so nothing else can reference this one — drop it
  // now rather than waiting for the manual sweep. Local files may be shared; leave those.
  if (existing.imageUrl?.startsWith('http')) await deleteUploadedImage(existing.imageUrl)
  return { success: true }
})
