<script setup lang="ts">
import { isFullReservation } from '~/composables/useReservations'
import type { Reservation, FullReservation } from '~/composables/useReservations'
import { nights } from '~~/shared/utils/booking'

const props = defineProps<{
  year: number
  month: number // 1-12
  reservations: Reservation[]
}>()

const emit = defineEmits<{
  prev: []
  next: []
  'select-bar': [reservation: FullReservation]
  'select-free': [apartmentId: string, date: string]
}>()

const { t, locale } = useI18n()
const { apartmentLabel, visibleApartmentIds: APARTMENTS } = useApartmentLabels()

const weekdays = computed(() => weekdaysMonFirst(locale.value as 'cs' | 'en'))

interface Segment {
  reservation: Reservation
  roundedLeft: boolean
  roundedRight: boolean
  half: boolean
}

function segmentsFor(apartmentId: string, date: string): Segment[] | null {
  const list = props.reservations.filter(r => r.apartmentId === apartmentId && r.status === 'active')

  const staying = list.find(r => r.arrival < date && r.departure > date)
  if (staying) {
    return [{ reservation: staying, roundedLeft: false, roundedRight: false, half: false }]
  }

  const outgoing = list.find(r => r.departure === date)
  const incoming = list.find(r => r.arrival === date)

  const segments: Segment[] = []
  if (outgoing) segments.push({ reservation: outgoing, roundedLeft: false, roundedRight: true, half: !!incoming })
  if (incoming) segments.push({ reservation: incoming, roundedLeft: true, roundedRight: false, half: !!outgoing })

  return segments.length ? segments : null
}

function barLabel(r: Reservation): string {
  if (!isFullReservation(r)) return t('calendar.occupied')
  return t('calendar.barLabel', { name: r.guestName, range: formatRangeShort(r.arrival, r.departure) })
}

function hoverPreview(r: Reservation): { title: string; lines: string[] } | null {
  if (!isFullReservation(r)) {
    return { title: t('calendar.occupied'), lines: [apartmentLabel(r.apartmentId)] }
  }
  const n = nights(r.arrival, r.departure)
  const lines = [
    apartmentLabel(r.apartmentId),
    `${formatRangeShort(r.arrival, r.departure)} · ${nightsLabel(n, locale.value as 'cs' | 'en')}`,
    peopleLabel(r.people, locale.value as 'cs' | 'en'),
  ]
  if (r.forGuest) lines.push(t('calendar.guestOf', { name: r.user.name }))
  return { title: r.guestName, lines }
}

const hovered = ref<{ preview: { title: string; lines: string[] }; x: number; y: number } | null>(null)

function onBarHover(reservation: Reservation, event: MouseEvent) {
  const preview = hoverPreview(reservation)
  if (!preview) return
  hovered.value = { preview, x: event.clientX, y: event.clientY }
}
function onBarLeave() {
  hovered.value = null
}

interface DayCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
}

const weeks = computed<DayCell[][]>(() => {
  const firstOfMonth = ymd(props.year, props.month, 1)
  const gridStart = startOfWeekMonday(firstOfMonth)
  const totalDaysInMonth = daysInMonth(props.year, props.month)
  const lastOfMonth = ymd(props.year, props.month, totalDaysInMonth)
  const offsetToLast = weekdayMonFirst(lastOfMonth)
  const cellsAfterMonthEnd = 6 - offsetToLast
  const startOffset = weekdayMonFirst(firstOfMonth)
  const totalCells = startOffset + totalDaysInMonth + cellsAfterMonthEnd
  const weekCount = Math.ceil(totalCells / 7)

  const today = todayStr()
  const cells: DayCell[] = []
  for (let i = 0; i < weekCount * 7; i++) {
    const date = addDays(gridStart, i)
    const { month } = parseYmd(date)
    cells.push({
      date,
      day: parseYmd(date).day,
      inMonth: month === props.month,
      isToday: date === today,
    })
  }

  const result: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    result.push(cells.slice(i, i + 7))
  }
  return result
})

function onBarClick(reservation: Reservation) {
  if (!isFullReservation(reservation)) return
  emit('select-bar', reservation)
}

function onFreeClick(apartmentId: string, date: string) {
  emit('select-free', apartmentId, date)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between px-1 pb-3">
      <button
        type="button"
        :aria-label="t('calendar.prevMonth')"
        class="rounded-full p-2 text-night transition hover:bg-cloud"
        @click="emit('prev')"
      >
        ←
      </button>
      <h2 class="font-heading text-lg md:text-xl font-medium text-night">
        {{ monthLabel(year, month, locale as unknown as 'cs' | 'en') }}
      </h2>
      <button
        type="button"
        :aria-label="t('calendar.nextMonth')"
        class="rounded-full p-2 text-night transition hover:bg-cloud"
        @click="emit('next')"
      >
        →
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-sm font-semibold uppercase tracking-wide text-stone md:text-base">
      <span v-for="wd in weekdays" :key="wd">{{ wd }}</span>
    </div>

    <div class="flex flex-col gap-1 px-1">
      <div v-for="(week, wi) in weeks" :key="wi" class="grid grid-cols-7 gap-1">
        <div
          v-for="cell in week"
          :key="cell.date"
          class="flex min-h-[58px] flex-col rounded-lg p-1"
          :class="[
            cell.inMonth ? 'bg-cloud/60' : 'bg-transparent',
            cell.isToday ? 'ring-1 ring-sea-deep' : '',
          ]"
        >
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium md:font-bold leading-none"
            :class="cell.inMonth ? 'bg-white text-stone' : 'text-stone/40'"
          >
            {{ cell.day }}
          </span>

          <div class="mt-1 flex flex-col gap-0.5">
            <div v-for="apartmentId in APARTMENTS" :key="apartmentId" class="flex min-w-0 items-center gap-0.5">
              <span class="shrink-0 text-[9px] leading-none text-stone sm:w-6 sm:text-[10px]">{{ apartmentLabel(apartmentId) }}</span>

              <!-- Mobile (< sm): just colorful circles next to the apartment name -->
              <div class="flex shrink-0 items-center gap-0.5 sm:hidden">
                <template v-if="segmentsFor(apartmentId, cell.date)">
                  <button
                    v-for="(seg, si) in segmentsFor(apartmentId, cell.date)!"
                    :key="si"
                    type="button"
                    class="h-2.5 w-2.5 rounded-full"
                    :style="isFullReservation(seg.reservation) ? { backgroundColor: seg.reservation.user.color } : undefined"
                    :class="!isFullReservation(seg.reservation) ? 'bg-stone/40' : ''"
                    :aria-label="barLabel(seg.reservation)"
                    @click="onBarClick(seg.reservation)"
                  />
                </template>
                <button
                  v-else
                  type="button"
                  class="h-2.5 w-2.5 rounded-full bg-ink/10"
                  :aria-label="t('calendar.freeBook')"
                  @click="onFreeClick(apartmentId, cell.date)"
                />
              </div>

              <!-- sm and up: full-width bars -->
              <div class="hidden h-2.5 min-w-0 flex-1 overflow-hidden rounded-full sm:flex">
                <template v-if="segmentsFor(apartmentId, cell.date)">
                  <CalendarReservationBar
                    v-for="(seg, si) in segmentsFor(apartmentId, cell.date)!"
                    :key="si"
                    :color="isFullReservation(seg.reservation) ? seg.reservation.user.color : null"
                    :anonymized="!isFullReservation(seg.reservation)"
                    :rounded-left="seg.roundedLeft"
                    :rounded-right="seg.roundedRight"
                    :clickable="isFullReservation(seg.reservation)"
                    :class="seg.half ? 'flex-none basis-1/2' : ''"
                    :ariaLabel="barLabel(seg.reservation)"
                    @click="onBarClick(seg.reservation)"
                    @mouseenter="onBarHover(seg.reservation, $event)"
                    @mousemove="onBarHover(seg.reservation, $event)"
                    @mouseleave="onBarLeave"
                  />
                </template>
                <button
                  v-else
                  type="button"
                  class="h-2.5 w-full flex-1 rounded-full bg-ink/10 transition hover:bg-sea-deep/25"
                  :aria-label="t('calendar.freeBook')"
                  @click="onFreeClick(apartmentId, cell.date)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="hovered"
        class="pointer-events-none fixed z-50 rounded-lg border border-cloud bg-white px-3 py-2 text-xs text-night shadow-lg"
        :style="{ left: `${hovered.x + 12}px`, top: `${hovered.y + 12}px` }"
      >
        <p class="font-medium">{{ hovered.preview.title }}</p>
        <p v-for="(line, i) in hovered.preview.lines" :key="i" class="text-stone">{{ line }}</p>
      </div>
    </Teleport>
  </div>
</template>
