import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'

const VALID_ROLES = ['guest', 'family', 'admin']
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  if (typeof body.name !== 'string' || !body.name.trim()) {
    throw createError({ statusCode: 400, message: 'Chybí jméno.' })
  }
  if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({ statusCode: 400, message: 'Neplatný e-mail.' })
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    throw createError({ statusCode: 400, message: 'Heslo musí mít alespoň 8 znaků.' })
  }
  if (typeof body.color !== 'string' || !HEX_COLOR.test(body.color)) {
    throw createError({ statusCode: 400, message: 'Neplatná barva (formát #RRGGBB).' })
  }
  if (typeof body.role !== 'string' || !VALID_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, message: 'Neplatná role.' })
  }

  const db = useDb()
  const existing = db.select().from(users).all().find((u) => u.email === body.email)
  if (existing) {
    throw createError({ statusCode: 400, message: 'Tento e-mail už je zaregistrovaný.' })
  }

  const passwordHash = await hashPassword(body.password)

  const row = db
    .insert(users)
    .values({
      name: body.name.trim(),
      email: body.email,
      passwordHash,
      role: body.role,
      color: body.color,
      createdAt: new Date().toISOString(),
    })
    .returning()
    .get()

  const { passwordHash: _omit, ...safe } = row
  return safe
})
