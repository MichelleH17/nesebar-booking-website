export interface Weather {
  current: { temp: number } | null
  daily: Array<{ date: string; min: number; max: number }>
  sea: number | null
}
