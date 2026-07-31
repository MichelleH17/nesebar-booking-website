import { describe, it, expect } from 'vitest'
import { overlaps, nights, calcPrice } from '../shared/utils/booking'

describe('overlaps', () => {
  const r = { arrival: '2026-08-10', departure: '2026-08-15' }
  it('detects overlap', () => {
    expect(overlaps(r, { arrival: '2026-08-14', departure: '2026-08-20' })).toBe(true)
    expect(overlaps(r, { arrival: '2026-08-01', departure: '2026-08-11' })).toBe(true)
    expect(overlaps(r, { arrival: '2026-08-11', departure: '2026-08-12' })).toBe(true)
  })
  it('allows same-day changeover', () => {
    expect(overlaps(r, { arrival: '2026-08-15', departure: '2026-08-20' })).toBe(false)
    expect(overlaps(r, { arrival: '2026-08-01', departure: '2026-08-10' })).toBe(false)
  })
})

describe('nights', () => {
  it('counts nights', () => expect(nights('2026-08-10', '2026-08-15')).toBe(5))
})

describe('calcPrice', () => {
  it('rate x nights', () => expect(calcPrice(5, 1000, 3, false)).toBe(5000))
  it('rate x nights x people when perPerson', () => expect(calcPrice(5, 1000, 3, true)).toBe(15000))
})
