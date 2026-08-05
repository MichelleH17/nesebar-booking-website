import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { photos } from '~~/server/db/schema'

// Public returns only visible photos; admin managers pass ?all=true to also get hidden ones.
export default defineEventHandler(async (event) => {
  const all = getQuery(event).all === 'true'
  const db = useDb()
  if (all) {
    await requireAdmin(event)
    return await db.select().from(photos).all()
  }
  return await db.select().from(photos).where(eq(photos.hidden, false)).all()
})
