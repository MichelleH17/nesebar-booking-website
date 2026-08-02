import { and, eq, ne } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { reservations, mailRecipients, apartments } from '~~/server/db/schema'
import { overlaps, calcPrice, nights as nightsBetween } from '~~/shared/utils/booking'
import type { SessionUser } from '~~/server/utils/session'

const APARTMENTS = ['15B', '16B'] as const
const TRAVEL_METHODS = ['car', 'plane', 'bus', 'train'] as const

export type ReservationInput = {
  apartmentId: string
  guestName: string
  people: number
  arrival: string
  departure: string
  travelMethod: string
  notes: string
  priceApplied: number | null
  forGuest: boolean
  notifyEmails: string[]
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function validateReservationInput(body: any): Promise<ReservationInput> {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Neplatná data rezervace.' })
  }

  const { apartmentId, guestName, people, arrival, departure, travelMethod, notes, priceApplied, forGuest, notifyEmails } = body

  if (typeof apartmentId !== 'string' || !APARTMENTS.includes(apartmentId as any)) {
    throw createError({ statusCode: 400, message: 'Neplatný byt.' })
  }

  if (typeof guestName !== 'string' || guestName.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Vyplňte jméno hosta.' })
  }

  if (typeof people !== 'number' || !Number.isInteger(people) || people < 1) {
    throw createError({ statusCode: 400, message: 'Počet osob musí být celé číslo alespoň 1.' })
  }

  if (typeof arrival !== 'string' || !DATE_RE.test(arrival) || typeof departure !== 'string' || !DATE_RE.test(departure)) {
    throw createError({ statusCode: 400, message: 'Neplatné datum příjezdu nebo odjezdu.' })
  }

  if (!(arrival < departure)) {
    throw createError({ statusCode: 400, message: 'Datum odjezdu musí být po datu příjezdu.' })
  }

  if (typeof travelMethod !== 'string' || !TRAVEL_METHODS.includes(travelMethod as any)) {
    throw createError({ statusCode: 400, message: 'Neplatný způsob dopravy.' })
  }

  const notesValue = typeof notes === 'string' ? notes : ''

  // priceApplied from the client only signals paid-vs-free intent (checkbox state);
  // the actual amount is always recomputed here from the apartment's rate — never
  // trust a client-submitted number, it could be tampered with.
  const wantsPaid = priceApplied !== null && priceApplied !== undefined
  if (wantsPaid && (typeof priceApplied !== 'number' || !Number.isInteger(priceApplied) || priceApplied <= 0)) {
    throw createError({ statusCode: 400, message: 'Neplatná cena.' })
  }

  let priceValue: number | null = null
  if (wantsPaid) {
    const apartment = useDb().select().from(apartments).where(eq(apartments.id, apartmentId)).get()
    // Apartment with hidden pricing → stays are always recorded without a price.
    if (apartment && !apartment.priceHidden) {
      priceValue = calcPrice(nightsBetween(arrival, departure), apartment.nightlyRate, people, apartment.perPersonPricing)
    }
  }

  let notifyEmailsValue: string[] = []
  if (notifyEmails !== undefined && notifyEmails !== null) {
    if (!Array.isArray(notifyEmails) || notifyEmails.some((e) => typeof e !== 'string')) {
      throw createError({ statusCode: 400, message: 'Neplatný seznam e-mailů pro upozornění.' })
    }
    if (notifyEmails.length > 0) {
      const db = useDb()
      const active = db.select().from(mailRecipients).where(eq(mailRecipients.active, true)).all()
      const activeEmails = new Set(active.map((r) => r.email))
      for (const e of notifyEmails) {
        if (!activeEmails.has(e)) {
          throw createError({ statusCode: 400, message: `Neznámý e-mail pro upozornění: ${e}` })
        }
      }
    }
    notifyEmailsValue = notifyEmails
  }

  return {
    apartmentId,
    guestName: guestName.trim(),
    people,
    arrival,
    departure,
    travelMethod,
    notes: notesValue,
    priceApplied: priceValue,
    forGuest: forGuest === true,
    notifyEmails: notifyEmailsValue,
  }
}

export function assertNoConflict(
  db: ReturnType<typeof useDb>,
  apartmentId: string,
  arrival: string,
  departure: string,
  viewerRole: SessionUser['role'],
  excludeId?: number,
) {
  const conditions = [eq(reservations.apartmentId, apartmentId), eq(reservations.status, 'active')]
  if (excludeId !== undefined) {
    conditions.push(ne(reservations.id, excludeId))
  }
  const existing = db.select().from(reservations).where(and(...conditions)).all()

  for (const row of existing) {
    if (overlaps({ arrival, departure }, { arrival: row.arrival, departure: row.departure })) {
      const message =
        viewerRole === 'guest'
          ? `Termín se překrývá s existující rezervací (${row.arrival} – ${row.departure}). Zkuste jiné datum.`
          : `Termín se překrývá s rezervací (${row.guestName}, ${row.arrival} – ${row.departure}).`
      throw createError({
        statusCode: 409,
        message,
      })
    }
  }
}
