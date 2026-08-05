import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { photos } from '~~/server/db/schema'

const VALID_APARTMENTS = ['15B', '16B']

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

  const body = await readBody(event)
  const update: Record<string, unknown> = {}

  if (body.alt !== undefined) {
    if (typeof body.alt !== 'string' || !body.alt.trim()) {
      throw createError({ statusCode: 400, message: 'Neplatný popisek fotky.' })
    }
    update.alt = body.alt.trim()
  }
  if (body.altEn !== undefined) {
    if (typeof body.altEn !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatný anglický popisek fotky.' })
    }
    update.altEn = body.altEn.trim()
  }
  if (body.apartmentId !== undefined) {
    if (body.apartmentId !== null && !VALID_APARTMENTS.includes(body.apartmentId)) {
      throw createError({ statusCode: 400, message: 'Neplatný byt.' })
    }
    update.apartmentId = body.apartmentId
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
  if (body.onHomepage !== undefined) {
    if (typeof body.onHomepage !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná hodnota pro homepage.' })
    }
    update.onHomepage = body.onHomepage
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'Žádná data k úpravě.' })
  }

  return await db.update(photos).set(update).where(eq(photos.id, id)).returning().get()
})
