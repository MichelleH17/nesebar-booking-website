import { desc } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { pageViews } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return useDb().select().from(pageViews).orderBy(desc(pageViews.id)).limit(1000).all()
})
