import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { mailRecipients } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  // Admins can request the full list (incl. inactive) to manage recipients.
  const wantsAll = getQuery(event).all !== undefined
  if (wantsAll && user.role === 'admin') {
    return db
      .select({
        id: mailRecipients.id,
        name: mailRecipients.name,
        email: mailRecipients.email,
        active: mailRecipients.active,
        sortOrder: mailRecipients.sortOrder,
      })
      .from(mailRecipients)
      .all()
  }

  // Default: active recipients only, minimal fields — feeds the reservation form checkboxes.
  return db
    .select({ id: mailRecipients.id, name: mailRecipients.name, email: mailRecipients.email })
    .from(mailRecipients)
    .where(eq(mailRecipients.active, true))
    .all()
})
