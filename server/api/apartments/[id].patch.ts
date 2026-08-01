import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { apartments } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const db = useDb()

  const existing = db.select().from(apartments).where(eq(apartments.id, id!)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Byt nenalezen.' })
  }

  const body = await readBody(event)
  const update: Record<string, unknown> = {}

  if (body.label !== undefined) {
    if (typeof body.label !== 'string' || !body.label.trim()) {
      throw createError({ statusCode: 400, message: 'Neplatné označení bytu.' })
    }
    update.label = body.label.trim()
  }
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw createError({ statusCode: 400, message: 'Neplatný název bytu.' })
    }
    update.name = body.name.trim()
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || !body.description.trim()) {
      throw createError({ statusCode: 400, message: 'Neplatný popis bytu.' })
    }
    update.description = body.description.trim()
  }
  if (body.nameEn !== undefined) {
    if (typeof body.nameEn !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatný anglický název bytu.' })
    }
    update.nameEn = body.nameEn.trim()
  }
  if (body.descriptionEn !== undefined) {
    if (typeof body.descriptionEn !== 'string') {
      throw createError({ statusCode: 400, message: 'Neplatný anglický popis bytu.' })
    }
    update.descriptionEn = body.descriptionEn.trim()
  }
  if (body.capacity !== undefined) {
    if (!Number.isInteger(body.capacity) || body.capacity < 1) {
      throw createError({ statusCode: 400, message: 'Neplatná kapacita.' })
    }
    update.capacity = body.capacity
  }
  if (body.nightlyRate !== undefined) {
    if (!Number.isInteger(body.nightlyRate) || body.nightlyRate < 0) {
      throw createError({ statusCode: 400, message: 'Neplatná cena za noc.' })
    }
    update.nightlyRate = body.nightlyRate
  }
  if (body.perPersonPricing !== undefined) {
    if (typeof body.perPersonPricing !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná hodnota cenění za osobu.' })
    }
    update.perPersonPricing = body.perPersonPricing
  }
  if (body.priceHidden !== undefined) {
    if (typeof body.priceHidden !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná hodnota skrytí ceny.' })
    }
    update.priceHidden = body.priceHidden
  }
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná hodnota skrytí bytu.' })
    }
    update.hidden = body.hidden
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'Žádná data k úpravě.' })
  }

  return db.update(apartments).set(update).where(eq(apartments.id, id!)).returning().get()
})
