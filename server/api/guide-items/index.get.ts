import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { guideItems } from '~~/server/db/schema'

// Public returns only visible items; admin managers pass ?all=true to also get hidden ones.
export default defineEventHandler(async (event) => {
  const all = getQuery(event).all === 'true'
  const db = useDb()
  if (all) {
    await requireAdmin(event)
    return await db.select().from(guideItems).all()
  }
  return await db.select().from(guideItems).where(eq(guideItems.hidden, false)).all()
})
