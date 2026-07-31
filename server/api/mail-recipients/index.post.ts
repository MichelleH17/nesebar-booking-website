import { useDb } from '~~/server/db'
import { mailRecipients } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  if (typeof body.name !== 'string' || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'Chybí jméno.' })
  }
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({ statusCode: 400, message: 'Neplatný e-mail.' })
  }

  const db = useDb()
  const existing = db.select().from(mailRecipients).all().find((r) => r.email === body.email)
  if (existing) {
    throw createError({ statusCode: 400, message: 'Tento e-mail už je zaregistrovaný.' })
  }

  let active = true
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      throw createError({ statusCode: 400, message: 'Neplatná hodnota aktivity.' })
    }
    active = body.active
  }
  let sortOrder = 0
  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      throw createError({ statusCode: 400, message: 'Neplatné pořadí.' })
    }
    sortOrder = body.sortOrder
  }

  return db
    .insert(mailRecipients)
    .values({ name: body.name.trim(), email: body.email, active, sortOrder })
    .returning()
    .get()
})
