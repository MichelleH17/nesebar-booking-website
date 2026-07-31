import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { reservations, users } from '~~/server/db/schema'

// Grey used for guest/friend stays (matches the seeded "Host" account colour).
const GUEST_COLOR = '#9AA0A6'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = useDb()

  const rows = db
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

  if (user.role === 'guest') {
    return rows
      .filter((r) => r.userId === user.id || r.status === 'active')
      .map((r) => {
        if (r.userId === user.id) {
          const { userName, userColor, ...rest } = r
          return { ...rest, user: { name: userName, color: r.forGuest ? GUEST_COLOR : userColor } }
        }
        return {
          id: r.id,
          apartmentId: r.apartmentId,
          arrival: r.arrival,
          departure: r.departure,
          status: r.status,
          anonymized: true,
        }
      })
  }

  return rows.map((r) => {
    const { userName, userColor, ...rest } = r
    return { ...rest, user: { name: userName, color: r.forGuest ? GUEST_COLOR : userColor } }
  })
})
