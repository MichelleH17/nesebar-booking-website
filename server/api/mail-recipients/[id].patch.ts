import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { mailRecipients } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID příjemce.' })
  }

  const db = useDb()
  const existing = db.select().from(mailRecipients).where(eq(mailRecipients.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Příjemce nenalezen.' })
  }

  const body = await readBody(event)
  const update: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      throw createError({ statusCode: 400, message: 'Chybí jméno.' })
    }
    update.name = body.name.trim()
  }
  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      throw createError({ statusCode: 400, message: 'Neplatný e-mail.' })
    }
    const dup = db.select().from(mailRecipients).all().find((r) => r.email === body.email && r.id !== id)
    if (dup) {
      throw createError({ statusCode: 400, message: 'Tento e-mail už je zaregistrovaný.' })
    }
    update.email = body.email
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná hodnota aktivity.' })
    }
    update.active = body.active
  }
  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      throw createError({ statusCode: 400, message: 'Neplatné pořadí.' })
    }
    update.sortOrder = body.sortOrder
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'Žádná data k úpravě.' })
  }

  return db.update(mailRecipients).set(update).where(eq(mailRecipients.id, id)).returning().get()
})
