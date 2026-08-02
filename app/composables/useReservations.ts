export interface ReservationUser {
  name: string
  color: string
}

export interface FullReservation {
  id: number
  apartmentId: string
  userId: number
  guestName: string
  people: number
  arrival: string
  departure: string
  travelMethod: 'car' | 'plane' | 'bus' | 'train'
  notes: string
  priceApplied: number | null
  forGuest: boolean
  notifyEmails: string[]
  status: 'active' | 'cancelled'
  createdAt: string
  updatedAt: string
  user: ReservationUser
  anonymized?: false
}

export interface AnonymizedReservation {
  id: number
  apartmentId: string
  arrival: string
  departure: string
  status: 'active' | 'cancelled'
  anonymized: true
}

export type Reservation = FullReservation | AnonymizedReservation

export function isFullReservation(r: Reservation): r is FullReservation {
  return !('anonymized' in r) || !r.anonymized
}

export function useReservations() {
  const { data: reservations, refresh, pending, error } = useFetch<Reservation[]>('/api/reservations', {
    default: () => [],
  })

  function forApartment(apartmentId: string) {
    return computed(() => (reservations.value ?? []).filter(r => r.apartmentId === apartmentId))
  }

  /**
   * Reservations (active only) that overlap the given date range [from, to) — string comparison, no Date().
   */
  function occupantsInRange(from: string, to: string) {
    return (reservations.value ?? []).filter((r) => {
      if (r.status !== 'active') return false
      return r.arrival < to && from < r.departure
    })
  }

  return { reservations, refresh, pending, error, forApartment, occupantsInRange }
}
