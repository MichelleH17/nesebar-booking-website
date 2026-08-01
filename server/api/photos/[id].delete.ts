import { eq } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { useDb } from '~~/server/db'
import { photos } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID fotky.' })
  }

  const db = useDb()
  const existing = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Fotka nenalezena.' })
  }

  db.delete(photos).where(eq(photos.id, id)).run()

  if (existing.url.startsWith('/uploads/')) {
    const filePath = join(process.cwd(), 'public', existing.url)
    try {
      await unlink(filePath)
    } catch {
      // ignore missing file
    }
  }

  return { success: true }
})
