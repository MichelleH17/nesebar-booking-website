import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'

// One-click portfolio login: signs in as the seeded demo user without any credentials.
// Returns 404 on deployments that have no demo user (e.g. the real family instance),
// which keeps the "Vyzkoušet ukázku" button inert there.
export default defineEventHandler(async (event) => {
  const db = useDb()
  const user = db.select().from(users).where(eq(users.role, 'demo')).get()

  if (!user) {
    throw createError({ statusCode: 404, message: 'Ukázkový účet není k dispozici.' })
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
