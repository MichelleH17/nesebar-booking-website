import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { reservations, users } from '~~/server/db/schema'
import { shapeReservations } from '~~/shared/utils/visibility'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const rows = await db
    .select({
      id: reservations.id,
      apartmentId: reservations.apartmentId,
      userId: reservations.userId,
      guestName: reservations.guestName,
      people: reservations.people,
      arrival: reservations.arrival,
      departure: reservations.departure,
      travelMethod: reservations.travelMethod,
      notes: reservations.notes,
      priceApplied: reservations.priceApplied,
      forGuest: reservations.forGuest,
      notifyEmails: reservations.notifyEmails,
      status: reservations.status,
      createdAt: reservations.createdAt,
      updatedAt: reservations.updatedAt,
      userName: users.name,
      userColor: users.color,
    })
    .from(reservations)
    .leftJoin(users, eq(reservations.userId, users.id))
    .all()

  return shapeReservations(rows, user)
})
