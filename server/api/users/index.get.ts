import { useDb } from '~~/server/db'
import { users } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = useDb()
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      color: users.color,
      createdAt: users.createdAt,
    })
    .from(users)
    .all()
})
