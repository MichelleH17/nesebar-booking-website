import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  // Brute-force guard: 10 attempts per IP per 15 minutes. Applied before reading the
  // body so a flood costs nothing but the counter lookup.
  if (!allow(event, 'login', 10, 15 * 60 * 1000)) {
    throw createError({
      statusCode: 429,
      message: 'Příliš mnoho pokusů o přihlášení. Zkuste to prosím za chvíli.',
    })
  }

  const { email, password } = await readBody<{ email?: string; password?: string }>(event)

  if (!email || !password) {
    throw createError({ statusCode: 401, message: 'Nesprávný e-mail nebo heslo.' })
  }

  const db = useDb()
  const user = await db.select().from(users).where(eq(users.email, email)).get()

  if (!user) {
    throw createError({ statusCode: 401, message: 'Nesprávný e-mail nebo heslo.' })
  }

  const valid = await verifyPassword(user.passwordHash, password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Nesprávný e-mail nebo heslo.' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      color: user.color,
    },
  })

  return { ok: true }
})
