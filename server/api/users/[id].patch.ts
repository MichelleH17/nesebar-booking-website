import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'

const VALID_ROLES = ['guest', 'family', 'admin']
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID uživatele.' })
  }

  const db = useDb()
  const existing = await db.select().from(users).where(eq(users.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Uživatel nenalezen.' })
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
    const dup = (await db.select().from(users).all()).find((u) => u.email === body.email && u.id !== id)
    if (dup) {
      throw createError({ statusCode: 400, message: 'Tento e-mail už je zaregistrovaný.' })
    }
    update.email = body.email
  }
  if (body.color !== undefined) {
    if (typeof body.color !== 'string' || !HEX_COLOR.test(body.color)) {
      throw createError({ statusCode: 400, message: 'Neplatná barva (formát #RRGGBB).' })
    }
    update.color = body.color
  }
  if (body.role !== undefined) {
    if (typeof body.role !== 'string' || !VALID_ROLES.includes(body.role)) {
      throw createError({ statusCode: 400, message: 'Neplatná role.' })
    }
    if (id === admin.id && body.role !== 'admin') {
      throw createError({ statusCode: 400, message: 'Nemůžete si sami odebrat roli správce.' })
    }
    update.role = body.role
  }
  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 8) {
      throw createError({ statusCode: 400, message: 'Heslo musí mít alespoň 8 znaků.' })
    }
    update.passwordHash = await hashPassword(body.password)
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'Žádná data k úpravě.' })
  }

  const row = await db.update(users).set(update).where(eq(users.id, id)).returning().get()
  const { passwordHash: _omit, ...safe } = row
  return safe
})
