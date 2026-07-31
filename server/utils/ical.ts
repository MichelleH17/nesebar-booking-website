export function reservationToIcs(r: {
  id: number; apartmentId: string; guestName: string
  arrival: string; departure: string; notes: string
}): string {
  const d = (s: string) => s.replaceAll('-', '')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//nessebar//rezervace//CS',
    'BEGIN:VEVENT',
    `UID:rezervace-${r.id}@nessebar.family`,
    `DTSTART;VALUE=DATE:${d(r.arrival)}`,
    `DTEND;VALUE=DATE:${d(r.departure)}`,
    `SUMMARY:Nesebar ${r.apartmentId} – ${esc(r.guestName)}`,
    `DESCRIPTION:${esc(r.notes)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}
