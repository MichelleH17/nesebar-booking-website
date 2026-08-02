// Pure string/UTC date-math helpers for the calendar. Dates are always 'YYYY-MM-DD'.
// We deliberately use Date.UTC()/getUTC*() everywhere so local timezone never shifts a calendar day.

export const CZECH_MONTHS = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
]

// Genitive form used after a day number, e.g. "12. července 2026"
export const CZECH_MONTHS_GENITIVE = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
]

export const CZECH_WEEKDAYS_MON_FIRST = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const ENGLISH_WEEKDAYS_MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type CalLocale = 'cs' | 'en'

/** Monday-first short weekday names for the given locale. */
export function weekdaysMonFirst(locale: CalLocale = 'cs'): string[] {
  return locale === 'en' ? ENGLISH_WEEKDAYS_MON_FIRST : CZECH_WEEKDAYS_MON_FIRST
}

/** "3 nocí" / "1 noc" (cs, 3-form) — "3 nights" / "1 night" (en). */
export function nightsLabel(n: number, locale: CalLocale = 'cs'): string {
  if (locale === 'en') return `${n} ${n === 1 ? 'night' : 'nights'}`
  return `${n} ${n === 1 ? 'noc' : n < 5 ? 'noci' : 'nocí'}`
}

/** "3 osoby" / "1 osoba" (cs, 3-form) — "3 people" / "1 person" (en). */
export function peopleLabel(n: number, locale: CalLocale = 'cs'): string {
  if (locale === 'en') return `${n} ${n === 1 ? 'person' : 'people'}`
  return `${n} ${n === 1 ? 'osoba' : n < 5 ? 'osoby' : 'osob'}`
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function ymd(year: number, month: number, day: number): string {
  // Normalize via UTC epoch so rollovers (month 13, day 0, day 32...) resolve correctly.
  const d = new Date(Date.UTC(year, month - 1, day))
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function parseYmd(dateStr: string): { year: number, month: number, day: number } {
  const [y = 0, m = 0, d = 0] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseYmd(dateStr)
  const ms = Date.UTC(year, month - 1, day) + days * 86_400_000
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** Monday-first weekday index: 0 = Monday .. 6 = Sunday. */
export function weekdayMonFirst(dateStr: string): number {
  const { year, month, day } = parseYmd(dateStr)
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay() // 0 = Sunday
  return (jsDay + 6) % 7
}

export function startOfWeekMonday(dateStr: string): string {
  return addDays(dateStr, -weekdayMonFirst(dateStr))
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function monthLabel(year: number, month: number, locale: CalLocale = 'cs'): string {
  if (locale === 'en') {
    return `${ENGLISH_MONTHS[month - 1]} ${year}`
  }
  const name = CZECH_MONTHS[month - 1] ?? ''
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

/** "12. 7." */
export function formatShort(dateStr: string): string {
  const { month, day } = parseYmd(dateStr)
  return `${day}. ${month}.`
}

/** "12. července 2026" (cs) / "12 July 2026" (en) */
export function formatLong(dateStr: string, locale: CalLocale = 'cs'): string {
  const { year, month, day } = parseYmd(dateStr)
  if (locale === 'en') {
    return `${day} ${ENGLISH_MONTHS[month - 1]} ${year}`
  }
  return `${day}. ${CZECH_MONTHS_GENITIVE[month - 1]} ${year}`
}

/** "12. – 17. 7." (same month) or "28. 6. – 3. 7." (crossing months) */
export function formatRangeShort(arrival: string, departure: string): string {
  const a = parseYmd(arrival)
  const b = parseYmd(departure)
  if (a.month === b.month && a.year === b.year) {
    return `${a.day}. – ${b.day}. ${b.month}.`
  }
  return `${a.day}. ${a.month}. – ${b.day}. ${b.month}.`
}
