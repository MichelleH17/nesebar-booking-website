import { useDb } from '~~/server/db'
import { reservations } from '~~/server/db/schema'
import { validateReservationInput, assertNoConflict, bookingTransaction } from '~~/server/utils/reservations'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const input = await validateReservationInput(body)

  const db = useDb()
  const now = new Date().toISOString()

  // Overlap check and insert must share one transaction — awaiting between them
  // otherwise lets two concurrent requests both pass the check and double-book.
  const row = await bookingTransaction(db, async (tx) => {
    await assertNoConflict(tx, input.apartmentId, input.arrival, input.departure, user.role)

    return await tx
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
  })

  const { sent } = await sendReservationMail('created', row)

  return { ...row, emailSent: sent }
})
