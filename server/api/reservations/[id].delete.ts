import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { reservations } from '~~/server/db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID rezervace.' })
  }

  const db = useDb()
  const row = await db.select().from(reservations).where(eq(reservations.id, id)).get()
  if (!row) {
    throw createError({ statusCode: 404, message: 'Rezervace nenalezena.' })
  }

  if (row.userId !== user.id && user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Na tuto rezervaci nemáte právo.' })
  }

  if (row.status === 'cancelled') {
    throw createError({ statusCode: 400, message: 'Rezervace je již zrušená.' })
  }

  const updated = await db
    .update(reservations)
    .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
    .where(eq(reservations.id, id))
    .returning()
    .get()

  const { sent } = await sendReservationMail('cancelled', updated)

  return { ...updated, emailSent: sent }
})
