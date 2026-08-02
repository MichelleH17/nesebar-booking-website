<script setup lang="ts">
import { overlaps } from '~~/shared/utils/booking'
import type { Reservation } from '~/composables/useReservations'

const props = defineProps<{
  apartmentId: string
  reservations: Reservation[]
  excludeId?: number
}>()

const arrival = defineModel<string>('arrival', { required: true })
const departure = defineModel<string>('departure', { required: true })

const { t, locale } = useI18n()

const weekdays = computed(() => weekdaysMonFirst(locale.value as 'cs' | 'en'))
const today = todayStr()

// Start the view on the arrival month if set, else the current month.
const startParts = parseYmd(arrival.value && /^\d{4}-\d{2}-\d{2}$/.test(arrival.value) ? arrival.value : today)
const year = ref(startParts.year)
const month = ref(startParts.month)

function prevMonth() {
  if (month.value === 1) { month.value = 12; year.value-- }
  else month.value--
}
function nextMonth() {
  if (month.value === 12) { month.value = 1; year.value++ }
  else month.value++
}

// Active reservations for this apartment (excluding the one being edited).
const apartmentRes = computed(() =>
  props.reservations.filter(r =>
    r.apartmentId === props.apartmentId
    && r.status === 'active'
    && (props.excludeId === undefined || r.id !== props.excludeId),
  ),
)

// A day's night (day → day+1) is occupied if some reservation covers it.
function nightOccupied(date: string): boolean {
  return apartmentRes.value.some(r => r.arrival <= date && date < r.departure)
}

// True if the whole range [from, to) is free of other reservations.
function rangeFree(from: string, to: string): boolean {
  return !apartmentRes.value.some(r => overlaps({ arrival: from, departure: to }, { arrival: r.arrival, departure: r.departure }))
}

function inSelectedRange(date: string): boolean {
  return !!arrival.value && !!departure.value && arrival.value <= date && date < departure.value
}

interface DayCell { date: string, day: number, inMonth: boolean, isToday: boolean, past: boolean }

const weeks = computed<DayCell[][]>(() => {
  const firstOfMonth = ymd(year.value, month.value, 1)
  const gridStart = startOfWeekMonday(firstOfMonth)
  const total = daysInMonth(year.value, month.value)
  const lastOfMonth = ymd(year.value, month.value, total)
  const cellsAfter = 6 - weekdayMonFirst(lastOfMonth)
  const weekCount = Math.ceil((weekdayMonFirst(firstOfMonth) + total + cellsAfter) / 7)

  const cells: DayCell[] = []
  for (let i = 0; i < weekCount * 7; i++) {
    const date = addDays(gridStart, i)
    const p = parseYmd(date)
    cells.push({ date, day: p.day, inMonth: p.month === month.value, isToday: date === today, past: date < today })
  }
  const result: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7))
  return result
})

// Two-click flow: first click picks arrival, second picks departure.
// (A parent watch may auto-fill departure to arrival+1, so we track the mode ourselves.)
const mode = ref<'start' | 'end'>('start')

function onDayClick(cell: DayCell) {
  if (cell.past) return
  const d = cell.date

  if (mode.value === 'start') {
    if (nightOccupied(d)) return // can't start a stay on an occupied night
    arrival.value = d
    departure.value = addDays(d, 1) // provisional 1 night; extend with a second click
    mode.value = 'end'
    return
  }

  // choosing departure (end)
  if (d <= arrival.value) {
    if (nightOccupied(d)) return
    arrival.value = d
    departure.value = addDays(d, 1)
    return // stay in 'end' mode so the next click sets the checkout
  }
  if (rangeFree(arrival.value, d)) {
    departure.value = d
    mode.value = 'start'
  } else if (!nightOccupied(d)) {
    // clicked past an occupied night → restart from this free day
    arrival.value = d
    departure.value = addDays(d, 1)
  }
}
</script>

<template>
  <div class="rounded-2xl border border-cloud bg-white p-4">
    <div class="mb-3 flex items-center justify-between">
      <button type="button" :aria-label="t('calendar.prevMonth')" class="rounded-full p-2 text-night transition hover:bg-cloud" @click="prevMonth">←</button>
      <span class="font-heading text-sm font-medium text-night">{{ monthLabel(year, month, locale as unknown as 'cs' | 'en') }}</span>
      <button type="button" :aria-label="t('calendar.nextMonth')" class="rounded-full p-2 text-night transition hover:bg-cloud" @click="nextMonth">→</button>
    </div>

    <div class="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-stone">
      <span v-for="wd in weekdays" :key="wd">{{ wd }}</span>
    </div>

    <div class="flex flex-col gap-1">
      <div v-for="(week, wi) in weeks" :key="wi" class="grid grid-cols-7 gap-1">
        <button
          v-for="cell in week"
          :key="cell.date"
          type="button"
          :disabled="cell.past || (nightOccupied(cell.date) && !inSelectedRange(cell.date) && cell.date !== departure)"
          class="relative flex h-9 items-center justify-center rounded-lg text-sm transition"
          :class="[
            !cell.inMonth ? 'text-stone/30' : 'text-night',
            cell.past ? 'cursor-not-allowed text-stone/30' : '',
            cell.date === arrival || cell.date === departure ? 'bg-sea-deep font-semibold text-white' : '',
            inSelectedRange(cell.date) && cell.date !== arrival ? 'bg-sea-deep/15 text-sea-deep' : '',
            !cell.past && nightOccupied(cell.date) && !inSelectedRange(cell.date) && cell.date !== arrival && cell.date !== departure ? 'bg-cloud text-stone/50 line-through' : '',
            !cell.past && !nightOccupied(cell.date) && cell.date !== arrival && cell.date !== departure && !inSelectedRange(cell.date) ? 'hover:bg-cloud' : '',
            cell.isToday && cell.date !== arrival && cell.date !== departure ? 'ring-1 ring-sea-deep/40' : '',
          ]"
          @click="onDayClick(cell)"
        >
          {{ cell.day }}
        </button>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone">
      <span class="flex items-center gap-1.5"><span class="inline-block h-3 w-3 rounded bg-sea-deep" /> {{ t('reservation.calYourStay') }}</span>
      <span class="flex items-center gap-1.5"><span class="inline-block h-3 w-3 rounded bg-cloud" /> {{ t('reservation.calOccupied') }}</span>
    </div>
  </div>
</template>
