import { eq } from 'drizzle-orm'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { useDb } from '~~/server/db'
import { photos } from '~~/server/db/schema'

// Replaces a photo's image file in place; all other columns stay untouched.
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

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, message: 'Chybí data formuláře.' })
  }

  const url = saveUploadedImage(parts.find((p) => p.name === 'file'))
  const row = db.update(photos).set({ url }).where(eq(photos.id, id)).returning().get()

  // Remove the old file only if nothing references it anymore
  // (listOrphanUploads keeps placeholder-* and shared files safe).
  const oldFilename = existing.url.startsWith('/uploads/') ? existing.url.slice('/uploads/'.length) : null
  if (oldFilename && listOrphanUploads().includes(oldFilename)) {
    rmSync(join(uploadsDirPath(), oldFilename), { force: true })
  }

  return row
})
