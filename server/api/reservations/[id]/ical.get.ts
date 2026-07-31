import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { reservations } from '~~/server/db/schema'
import { reservationToIcs } from '~~/server/utils/ical'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: 'Neplatné ID rezervace.' })
  }

  const db = useDb()
  const row = db.select().from(reservations).where(eq(reservations.id, id)).get()
  if (!row) {
    throw createError({ statusCode: 404, message: 'Rezervace nenalezena.' })
  }

  if (row.userId !== user.id && user.role === 'guest') {
    throw createError({ statusCode: 403, message: 'Na tuto rezervaci nemáte právo.' })
  }

  const ics = reservationToIcs(row)

  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="rezervace-${row.apartmentId}.ics"`)

  return ics
})
