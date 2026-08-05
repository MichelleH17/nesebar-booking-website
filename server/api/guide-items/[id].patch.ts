import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { guideItems } from '~~/server/db/schema'

const VALID_TYPES = ['beach', 'trip', 'info']

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

  const body = await readBody(event)
  const update: Record<string, unknown> = {}

  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !VALID_TYPES.includes(body.type)) {
      throw createError({ statusCode: 400, message: 'Neplatný typ položky.' })
    }
    update.type = body.type
  }
  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw createError({ statusCode: 400, message: 'Chybí název.' })
    }
    update.title = body.title.trim()
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      throw createError({ statusCode: 400, message: 'Chybí popis.' })
    }
    update.description = body.description.trim()
  }
  if (body.titleEn !== undefined) {
    if (typeof body.titleEn !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatný anglický název.' })
    }
    update.titleEn = body.titleEn.trim()
  }
  if (body.descriptionEn !== undefined) {
    if (typeof body.descriptionEn !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatný anglický popis.' })
    }
    update.descriptionEn = body.descriptionEn.trim()
  }
  if (body.metaEn !== undefined) {
    if (body.metaEn !== null && typeof body.metaEn !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatné anglické meta pole.' })
    }
    update.metaEn = body.metaEn
  }
  if (body.imageUrl !== undefined) {
    if (body.imageUrl !== null && typeof body.imageUrl !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatná URL obrázku.' })
    }
    update.imageUrl = body.imageUrl
  }
  if (body.meta !== undefined) {
    if (body.meta !== null && typeof body.meta !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatné meta pole.' })
    }
    update.meta = body.meta
  }
  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      throw createError({ statusCode: 400, message: 'Neplatné pořadí.' })
    }
    update.sortOrder = body.sortOrder
  }
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná viditelnost.' })
    }
    update.hidden = body.hidden
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'Žádná data k úpravě.' })
  }

  const updated = await db.update(guideItems).set(update).where(eq(guideItems.id, id)).returning().get()

  // Blob URLs are unique per upload, so nothing else can reference the replaced one —
  // drop it now rather than waiting for the manual sweep. Local files may be shared.
  if (
    update.imageUrl !== undefined
    && existing.imageUrl
    && existing.imageUrl !== update.imageUrl
    && existing.imageUrl.startsWith('http')
  ) {
    await deleteUploadedImage(existing.imageUrl)
  }

  return updated
})
