import { describe, it, expect } from 'vitest'
import { reservationToIcs } from '../server/utils/ical'

describe('reservationToIcs', () => {
  it('generates valid iCalendar format with CRLF line endings', () => {
    const reservation = {
      id: 1,
      apartmentId: '15B',
      guestName: 'Jana',
      arrival: '2026-08-10',
      departure: '2026-08-15',
      notes: 'Test notes',
    }

    const ics = reservationToIcs(reservation)

    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART;VALUE=DATE:20260810')
    expect(ics).toContain('DTEND;VALUE=DATE:20260815')
    expect(ics).toContain('SUMMARY:Nesebar 15B – Jana')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toMatch(/\r\n/g)
  })

  it('escapes special characters and newlines in guest name and notes', () => {
    const reservation = {
      id: 2,
      apartmentId: '15B',
      guestName: 'Jana, Petr; spol\\',
      arrival: '2026-08-10',
      departure: '2026-08-15',
      notes: 'první řádek\ndruhý',
    }

    const ics = reservationToIcs(reservation)

    expect(ics).toContain('SUMMARY:Nesebar 15B – Jana\\, Petr\\; spol\\\\')
    expect(ics).toContain('DESCRIPTION:první řádek\\ndruhý')
  })

  it('uses only CRLF line endings, never bare LF', () => {
    const reservation = {
      id: 3,
      apartmentId: '16B',
      guestName: 'Test Guest',
      arrival: '2026-09-01',
      departure: '2026-09-05',
      notes: 'Some notes',
    }

    const ics = reservationToIcs(reservation)

    // Split by CRLF and verify no line contains bare \n
    const lines = ics.split('\r\n')
    expect(lines.every(line => !line.includes('\n'))).toBe(true)
  })
})
