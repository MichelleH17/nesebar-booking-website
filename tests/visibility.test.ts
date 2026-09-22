import { describe, it, expect } from 'vitest'
import { shapeApartments, shapeReservations, isAdminRole, GUEST_COLOR } from '../shared/utils/visibility'
import type { Apartment } from '../shared/types/apartment'

const apartment = (id: string, hidden: boolean): Apartment => ({
  id,
  label: id,
  name: `Byt ${id}`,
  nameEn: `Flat ${id}`,
  description: '',
  descriptionEn: '',
  capacity: 4,
  nightlyRate: 1100,
  perPersonPricing: false,
  priceHidden: false,
  hidden,
})

const ROWS = [apartment('15B', false), apartment('16B', true)]

describe('shapeApartments', () => {
  it('hides pricing columns from anonymous callers', () => {
    const [first] = shapeApartments(ROWS, undefined)
    expect(first).toBeDefined()
    expect(first).not.toHaveProperty('nightlyRate')
    expect(first).not.toHaveProperty('perPersonPricing')
    expect(first).not.toHaveProperty('priceHidden')
  })

  it('hides hidden apartments from everyone except admin screens', () => {
    expect(shapeApartments(ROWS, undefined).map((a) => a.id)).toEqual(['15B'])
    expect(shapeApartments(ROWS, 'guest').map((a) => a.id)).toEqual(['15B'])
    expect(shapeApartments(ROWS, 'family').map((a) => a.id)).toEqual(['15B'])
    expect(shapeApartments(ROWS, 'admin').map((a) => a.id)).toEqual(['15B', '16B'])
    expect(shapeApartments(ROWS, 'demo').map((a) => a.id)).toEqual(['15B', '16B'])
  })

  it('keeps pricing for any logged-in role (the reservation form needs the rate)', () => {
    for (const role of ['guest', 'family', 'admin', 'demo']) {
      expect(shapeApartments(ROWS, role)[0]).toHaveProperty('nightlyRate', 1100)
    }
  })

  it('treats demo as an admin-level reader', () => {
    expect(isAdminRole('demo')).toBe(true)
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('family')).toBe(false)
    expect(isAdminRole(undefined)).toBe(false)
  })
})

const reservation = (id: number, userId: number, status: string, forGuest = false) => ({
  id,
  apartmentId: '15B',
  userId,
  arrival: '2026-07-01',
  departure: '2026-07-08',
  status,
  forGuest,
  guestName: 'Tajné jméno',
  notes: 'Tajná poznámka',
  priceApplied: 5000,
  userName: 'Vojta',
  userColor: '#4A90A4',
})

const RESERVATIONS = [
  reservation(1, 42, 'active'), // someone else's, active
  reservation(2, 42, 'cancelled'), // someone else's, cancelled
  reservation(3, 7, 'active'), // the guest's own
]

describe('shapeReservations', () => {
  const guest = { id: 7, role: 'guest' }

  it("strips names, notes and prices from other people's reservations for a guest", () => {
    const other = shapeReservations(RESERVATIONS, guest).find((r) => r.id === 1)
    expect(other).toEqual({
      id: 1,
      apartmentId: '15B',
      arrival: '2026-07-01',
      departure: '2026-07-08',
      status: 'active',
      anonymized: true,
    })
    expect(JSON.stringify(other)).not.toContain('Tajné')
  })

  it("does not leak other people's cancelled reservations to a guest", () => {
    expect(shapeReservations(RESERVATIONS, guest).map((r) => r.id)).toEqual([1, 3])
  })

  it('gives the guest their own reservation in full', () => {
    const own = shapeReservations(RESERVATIONS, guest).find((r) => r.id === 3)
    expect(own).toMatchObject({ guestName: 'Tajné jméno', notes: 'Tajná poznámka', priceApplied: 5000 })
  })

  it('gives family and admin every row with the owner attached', () => {
    for (const role of ['family', 'admin', 'demo']) {
      const all = shapeReservations(RESERVATIONS, { id: 99, role })
      expect(all.map((r) => r.id)).toEqual([1, 2, 3])
      expect(all[0]).toMatchObject({ guestName: 'Tajné jméno', user: { name: 'Vojta', color: '#4A90A4' } })
    }
  })

  it('colours stays booked for a friend grey rather than by the owner', () => {
    const [row] = shapeReservations([reservation(1, 42, 'active', true)], { id: 42, role: 'family' })
    expect(row).toMatchObject({ user: { color: GUEST_COLOR } })
  })

  it('never exposes the raw join columns', () => {
    for (const row of shapeReservations(RESERVATIONS, { id: 99, role: 'admin' })) {
      expect(row).not.toHaveProperty('userName')
      expect(row).not.toHaveProperty('userColor')
    }
  })
})
