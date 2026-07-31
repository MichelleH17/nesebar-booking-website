import { describe, it, expect } from 'vitest'
import { computeStats } from '../shared/utils/stats'
import type { StatsReservation, StatsUser } from '../shared/utils/stats'

const users: StatsUser[] = [
  { id: 1, name: 'Anna', color: '#111111', role: 'family' },
  { id: 2, name: 'Bára', color: '#222222', role: 'family' },
]

// One paid (both Aug+Sep, in season), one spanning the year boundary (free),
// one cancelled (must be ignored entirely).
const reservations: StatsReservation[] = [
  { id: 1, apartmentId: '15B', userId: 1, guestName: 'Anna', arrival: '2026-08-28', departure: '2026-09-02', priceApplied: 5000, forGuest: false, status: 'active' },
  { id: 2, apartmentId: '16B', userId: 2, guestName: 'Bára', arrival: '2026-12-30', departure: '2027-01-03', priceApplied: null, forGuest: false, status: 'active' },
  { id: 3, apartmentId: '16B', userId: 2, guestName: 'Bára', arrival: '2026-07-10', departure: '2026-07-14', priceApplied: 9999, forGuest: false, status: 'cancelled' },
]

const stats = computeStats(reservations, users, 2026)

describe('computeStats perUser', () => {
  const anna = stats.perUser.find(u => u.userId === 1)!
  const bara = stats.perUser.find(u => u.userId === 2)!

  it('counts stays, ignoring cancelled', () => {
    expect(anna.stays).toBe(1)
    expect(bara.stays).toBe(1) // the cancelled 16B reservation is not counted
  })

  it('counts only nights inside the selected year', () => {
    expect(anna.nights).toBe(5) // Aug 28,29,30,31 + Sep 1
    expect(bara.nights).toBe(2) // Dec 30,31 (2027 nights excluded)
  })

  it('sums paid totals and lists paid stays', () => {
    expect(anna.paidTotal).toBe(5000)
    expect(anna.list).toEqual([{ id: 1, dates: '28. 8. – 2. 9. 2026', departure: '2026-09-02', nights: 5, amount: 5000 }])
    expect(bara.paidTotal).toBe(0)
    expect(bara.list).toEqual([{ id: 2, dates: '30. 12. 2026 – 3. 1. 2027', departure: '2027-01-03', nights: 2, amount: null }])
  })
})

describe('computeStats perApartment', () => {
  const a15 = stats.perApartment.find(a => a.apartmentId === '15B')!
  const a16 = stats.perApartment.find(a => a.apartmentId === '16B')!

  it('always includes both apartments', () => {
    expect(stats.perApartment.map(a => a.apartmentId).sort()).toEqual(['15B', '16B'])
  })

  it('buckets nights per month (Aug idx7, Sep idx8, Dec idx11)', () => {
    expect(a15.monthlyNights[7]).toBe(4)
    expect(a15.monthlyNights[8]).toBe(1)
    expect(a15.occupiedNights).toBe(5)
    expect(a16.monthlyNights[11]).toBe(2)
    expect(a16.occupiedNights).toBe(2)
  })

  it('computes season occupancy over 122 nights', () => {
    expect(a15.seasonNights).toBe(122)
    expect(a15.seasonOccupiedNights).toBe(5)
    expect(a15.seasonOccupancyPct).toBe(4) // round(5/122*100)
    expect(a16.seasonOccupiedNights).toBe(0) // December is outside the season
    expect(a16.seasonOccupancyPct).toBe(0)
  })

  it('lists free season gaps with correct night counts', () => {
    expect(a15.seasonGaps).toEqual([
      { from: '2026-06-01', to: '2026-08-28', nights: 88 },
      { from: '2026-09-02', to: '2026-10-01', nights: 29 },
    ])
    expect(a16.seasonGaps).toEqual([
      { from: '2026-06-01', to: '2026-10-01', nights: 122 },
    ])
  })
})
