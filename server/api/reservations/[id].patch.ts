import { eq } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { reservations } from '~~/server/db/schema'
import { validateReservationInput, assertNoConflict, bookingTransaction } from '~~/server/utils/reservations'

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
    throw createError({ statusCode: 400, message: 'Zrušenou rezervaci nelze upravit.' })
  }

  // Finished stays are history — nobody edits them anymore.
  if (row.departure < new Date().toISOString().slice(0, 10)) {
    throw createError({ statusCode: 400, message: 'Ukončenou rezervaci už nelze upravit.' })
  }

  const body = await readBody(event)
  const input = await validateReservationInput(body)

  // Overlap check and update must share one transaction — see reservations/index.post.ts.
  const updated = await bookingTransaction(db, async (tx) => {
    await assertNoConflict(tx, input.apartmentId, input.arrival, input.departure, user.role, id)

    return await tx
      .update(reservations)
      .set({
        apartmentId: input.apartmentId,
        guestName: input.guestName,
        people: input.people,
        arrival: input.arrival,
        departure: input.departure,
        travelMethod: input.travelMethod as any,
        notes: input.notes,
        priceApplied: input.priceApplied,
        forGuest: input.forGuest,
        notifyEmails: input.notifyEmails,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reservations.id, id))
      .returning()
      .get()
  })

  const { sent } = await sendReservationMail('updated', updated)

  return { ...updated, emailSent: sent }
})
