import { useDb } from '~~/server/db'
import { reservations, users } from '~~/server/db/schema'
import { computeStats } from '~~/shared/utils/stats'
import type { StatsReservation, StatsUser } from '~~/shared/utils/stats'

export default defineEventHandler(async (event) => {
  await requireFamily(event)

  const yearRaw = Number(getQuery(event).year)
  const year = Number.isInteger(yearRaw) ? yearRaw : new Date().getFullYear()

  const db = useDb()

  const resRows = db
    .select({
      id: reservations.id,
      apartmentId: reservations.apartmentId,
      userId: reservations.userId,
      guestName: reservations.guestName,
      forGuest: reservations.forGuest,
      arrival: reservations.arrival,
      departure: reservations.departure,
      priceApplied: reservations.priceApplied,
      status: reservations.status,
    })
    .from(reservations)
    .all() as StatsReservation[]

  const userRows = db
    .select({ id: users.id, name: users.name, color: users.color, role: users.role })
    .from(users)
    .orderBy(users.sortOrder, users.id)
    .all() as StatsUser[]

  return computeStats(resRows, userRows, year)
})
