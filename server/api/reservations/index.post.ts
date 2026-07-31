import { useDb } from '~~/server/db'
import { reservations } from '~~/server/db/schema'
import { validateReservationInput, assertNoConflict } from '~~/server/utils/reservations'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const input = await validateReservationInput(body)

  const db = useDb()
  assertNoConflict(db, input.apartmentId, input.arrival, input.departure, user.role)

  const now = new Date().toISOString()
  const row = db
    .insert(reservations)
    .values({
      apartmentId: input.apartmentId,
      userId: user.id,
      guestName: input.guestName,
      people: input.people,
      arrival: input.arrival,
      departure: input.departure,
      travelMethod: input.travelMethod as any,
      notes: input.notes,
      priceApplied: input.priceApplied,
      forGuest: input.forGuest,
      notifyEmails: input.notifyEmails,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get()

  const { sent } = await sendReservationMail('created', row)

  return { ...row, emailSent: sent }
})
