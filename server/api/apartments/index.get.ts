import { useDb } from '~~/server/db'
import { apartments } from '~~/server/db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  return await db.select().from(apartments).all()
})
