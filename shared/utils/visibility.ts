import type { Apartment, PublicApartment } from '../types/apartment'

// Who sees what. These are the read-side authorization rules, kept as pure functions
// so they can be tested directly (tests/visibility.test.ts) instead of only through
// a running server — they are the rules a public repo most needs a regression test on.

/** Grey used for guest/friend stays (matches the seeded "Host" account colour). */
export const GUEST_COLOR = '#9AA0A6'

/** Roles allowed on the admin screens: they see hidden apartments and pricing. */
export function isAdminRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'demo'
}

/**
 * Shapes the apartment list for a viewer. Anonymous callers get no pricing columns
 * (the landing page never shows prices) and never see hidden apartments; logged-in
 * non-admins see pricing but still no hidden ones; admin/demo see everything.
 */
export function shapeApartments(rows: Apartment[], role: string | undefined): PublicApartment[] {
  if (isAdminRole(role)) return rows
  const visible = rows.filter((a) => !a.hidden)
  if (role) return visible
  return visible.map(({ nightlyRate: _rate, perPersonPricing: _per, priceHidden: _hidden, ...pub }) => pub)
}

/** The reservation columns the guest anonymization needs; extra columns pass through. */
type JoinedReservation = {
  id: number
  apartmentId: string
  userId: number
  arrival: string
  departure: string
  status: string
  forGuest: boolean
  userName: string | null
  userColor: string | null
}

type OwnerView<T> = Omit<T, 'userName' | 'userColor'> & {
  user: { name: string | null; color: string | null }
}

type AnonymizedView = {
  id: number
  apartmentId: string
  arrival: string
  departure: string
  status: string
  anonymized: true
}

function withUser<T extends JoinedReservation>(r: T): OwnerView<T> {
  const { userName, userColor, ...rest } = r
  return { ...rest, user: { name: userName, color: r.forGuest ? GUEST_COLOR : userColor } }
}

/**
 * Guests see their own reservations in full and everyone else's as dates + apartment
 * only — no names, colours, notes or prices — and never other people's cancelled rows.
 * Family and admin see everything.
 */
export function shapeReservations<T extends JoinedReservation>(
  rows: T[],
  viewer: { id: number; role: string },
): Array<OwnerView<T> | AnonymizedView> {
  if (viewer.role !== 'guest') return rows.map(withUser)

  return rows
    .filter((r) => r.userId === viewer.id || r.status === 'active')
    .map((r) =>
      r.userId === viewer.id
        ? withUser(r)
        : {
            id: r.id,
            apartmentId: r.apartmentId,
            arrival: r.arrival,
            departure: r.departure,
            status: r.status,
            anonymized: true as const,
          },
    )
}
