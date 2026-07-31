// Pure reservation-statistics helpers. Dates are always 'YYYY-MM-DD'.
// Season = June 1 – September 30 (122 nights). A "night" is a date in [arrival, departure).

export interface StatsReservation {
  id: number
  apartmentId: string
  userId: number
  guestName: string
  arrival: string
  departure: string
  priceApplied: number | null
  forGuest: boolean
  status: 'active' | 'cancelled'
}

export interface StatsUser {
  id: number
  name: string
  color: string
  role: string
}

export interface UserStay {
  id: number // reservation id — stays clickable in the dashboard
  dates: string
  departure: string // YYYY-MM-DD, for "finished stays are read-only" checks
  nights: number
  amount: number | null
}

export interface PersonStat {
  userId: number
  name: string
  color: string
  role: string
  stays: number
  nights: number
  paidTotal: number
  list: UserStay[]
}

export interface SeasonGap {
  from: string
  to: string
  nights: number
}

export interface ApartmentStat {
  apartmentId: string
  monthlyNights: number[] // 12 entries, Jan.Dec
  occupiedNights: number
  seasonOccupiedNights: number
  seasonNights: number
  seasonOccupancyPct: number
  seasonGaps: SeasonGap[]
}

export interface FriendStay {
  id: number // reservation id — stays clickable in the dashboard
  guestName: string
  ownerId: number
  ownerName: string // family member responsible for the friend
  dates: string
  departure: string // YYYY-MM-DD, for "finished stays are read-only" checks
  nights: number
  amount: number | null
}

export interface FriendsStat {
  stays: number
  nights: number
  paidTotal: number
  list: FriendStay[]
}

export interface Stats {
  perUser: PersonStat[]
  friends: FriendsStat
  perApartment: ApartmentStat[]
}

export const APARTMENTS = ['15B', '16B'] as const

const MS_PER_DAY = 86_400_000

function toEpoch(date: string): number {
  const [y = 0, m = 1, d = 1] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromEpoch(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

function addDay(date: string, days = 1): string {
  return fromEpoch(toEpoch(date) + days * MS_PER_DAY)
}

function monthIndex(date: string): number {
  return Number(date.split('-')[1]) - 1
}

/** Night-dates of a reservation, i.e. [arrival, departure), clipped to the given year. */
function nightsInYear(arrival: string, departure: string, year: number): string[] {
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  const out: string[] = []
  for (let ms = toEpoch(arrival); ms < toEpoch(departure); ms += MS_PER_DAY) {
    const d = fromEpoch(ms)
    if (d >= start && d <= end) out.push(d)
  }
  return out
}

/** Czech short range for a paid stay, e.g. "28. 8. – 2. 9. 2026". */
function formatRange(arrival: string, departure: string): string {
  const [ay, am, ad] = arrival.split('-').map(Number)
  const [by, bm, bd] = departure.split('-').map(Number)
  if (ay === by && am === bm) return `${ad}. – ${bd}. ${bm}. ${by}`
  if (ay === by) return `${ad}. ${am}. – ${bd}. ${bm}. ${by}`
  return `${ad}. ${am}. ${ay} – ${bd}. ${bm}. ${by}`
}

/** All season night-dates (June 1 – September 30) of a year, in order. */
function seasonDates(year: number): string[] {
  const out: string[] = []
  const end = toEpoch(`${year}-09-30`)
  for (let ms = toEpoch(`${year}-06-01`); ms <= end; ms += MS_PER_DAY) {
    out.push(fromEpoch(ms))
  }
  return out
}

export function computeStats(reservations: StatsReservation[], users: StatsUser[], year: number): Stats {
  const active = reservations.filter(r => r.status === 'active')

  // Friend stays live in their own combined card — family cards count only the family's own stays.
  const perUser: PersonStat[] = users.map((u) => {
    const own = active
      .filter(r => r.userId === u.id && !r.forGuest)
      .sort((a, b) => a.arrival.localeCompare(b.arrival))
    let stays = 0
    let nights = 0
    let paidTotal = 0
    const list: UserStay[] = []
    for (const r of own) {
      const n = nightsInYear(r.arrival, r.departure, year)
      if (n.length === 0) continue // no nights inside this year → not a stay this year
      stays += 1
      nights += n.length
      if (r.priceApplied !== null) paidTotal += r.priceApplied
      list.push({
        id: r.id,
        dates: formatRange(r.arrival, r.departure),
        departure: r.departure,
        nights: n.length,
        amount: r.priceApplied,
      })
    }
    return { userId: u.id, name: u.name, color: u.color, role: u.role, stays, nights, paidTotal, list }
  })

  const nameById = new Map(users.map(u => [u.id, u.name]))
  const friends: FriendsStat = { stays: 0, nights: 0, paidTotal: 0, list: [] }
  const friendReservations = active.filter(r => r.forGuest).sort((a, b) => a.arrival.localeCompare(b.arrival))
  for (const r of friendReservations) {
    const n = nightsInYear(r.arrival, r.departure, year)
    if (n.length === 0) continue
    friends.stays += 1
    friends.nights += n.length
    if (r.priceApplied !== null) friends.paidTotal += r.priceApplied
    friends.list.push({
      id: r.id,
      guestName: r.guestName,
      ownerId: r.userId,
      ownerName: nameById.get(r.userId) ?? '?',
      dates: formatRange(r.arrival, r.departure),
      departure: r.departure,
      nights: n.length,
      amount: r.priceApplied,
    })
  }
  const season = seasonDates(year)
  const seasonNights = season.length // 122

  const perApartment: ApartmentStat[] = APARTMENTS.map((apartmentId) => {
    const occupied = new Set<string>()
    for (const r of active) {
      if (r.apartmentId !== apartmentId) continue
      for (const d of nightsInYear(r.arrival, r.departure, year)) occupied.add(d)
    }

    const monthlyNights = new Array(12).fill(0)
    for (const d of occupied) monthlyNights[monthIndex(d)] += 1

    let seasonOccupiedNights = 0
    const seasonGaps: SeasonGap[] = []
    let runStart: string | null = null
    let runEnd: string | null = null
    const flush = () => {
      if (runStart && runEnd) {
        seasonGaps.push({
          from: runStart,
          to: addDay(runEnd),
          nights: (toEpoch(runEnd) - toEpoch(runStart)) / MS_PER_DAY + 1,
        })
      }
      runStart = null
      runEnd = null
    }
    for (const d of season) {
      if (occupied.has(d)) {
        seasonOccupiedNights += 1
        flush()
      } else {
        if (!runStart) runStart = d
        runEnd = d
      }
    }
    flush()

    return {
      apartmentId,
      monthlyNights,
      occupiedNights: occupied.size,
      seasonOccupiedNights,
      seasonNights,
      seasonOccupancyPct: Math.round((seasonOccupiedNights / seasonNights) * 100),
      seasonGaps,
    }
  })

  return { perUser, friends, perApartment }
}
