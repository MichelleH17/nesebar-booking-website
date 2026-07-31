export function overlaps(
  a: { arrival: string; departure: string },
  b: { arrival: string; departure: string },
): boolean {
  return a.arrival < b.departure && b.arrival < a.departure
}

export function nights(arrival: string, departure: string): number {
  return Math.round((Date.parse(departure) - Date.parse(arrival)) / 86_400_000)
}

export function calcPrice(nights: number, nightlyRate: number, people: number, perPerson: boolean): number {
  return nights * nightlyRate * (perPerson ? people : 1)
}
