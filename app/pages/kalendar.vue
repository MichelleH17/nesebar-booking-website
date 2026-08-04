<script setup lang="ts">
import { isFullReservation } from '~/composables/useReservations'
import type { FullReservation, Reservation } from '~/composables/useReservations'

definePageMeta({ middleware: 'auth' })

const { user } = useUserSession()
const { reservations, refresh } = useReservations()
const { t } = useI18n()

const route = useRoute()
const savedToast = ref<string | null>(null)
if (route.query.ulozeno === 'nova') savedToast.value = t('calendar.toastNew')
else if (route.query.ulozeno === 'upravena') savedToast.value = t('calendar.toastEdit')
if (import.meta.client && savedToast.value) {
  setTimeout(() => { savedToast.value = null }, 3500)
}

const today = todayStr()
const todayParts = parseYmd(today)

// ?mesic=YYYY-MM (set after saving a reservation) opens the calendar on that month.
const monthQuery = typeof route.query.mesic === 'string' && /^\d{4}-\d{2}$/.test(route.query.mesic)
  ? route.query.mesic
  : null
const queryMonthNum = monthQuery ? Number(monthQuery.slice(5)) : 0
const useQueryMonth = queryMonthNum >= 1 && queryMonthNum <= 12

const year = ref(useQueryMonth ? Number(monthQuery!.slice(0, 4)) : todayParts.year)
const month = ref(useQueryMonth ? queryMonthNum : todayParts.month) // 1-12

function prevMonth() {
  if (month.value === 1) {
    month.value = 12
    year.value -= 1
  } else {
    month.value -= 1
  }
}

function nextMonth() {
  if (month.value === 12) {
    month.value = 1
    year.value += 1
  } else {
    month.value += 1
  }
}

const selected = ref<FullReservation | null>(null)

function onSelectBar(reservation: FullReservation) {
  selected.value = reservation
}

function onSelectFree(apartmentId: string, date: string) {
  navigateTo(`/rezervace/nova?apartment=${apartmentId}&arrival=${date}`)
}

const canManageSelected = computed(() => {
  if (!selected.value) return false
  if (selected.value.departure < today) return false // finished stays are read-only
  return selected.value.userId === user.value?.id || user.value?.role === 'admin'
})

function findChangeoverPartner(res: FullReservation): Reservation | undefined {
  return (reservations.value ?? []).find(r =>
    r.id !== res.id
    && r.apartmentId === res.apartmentId
    && r.status === 'active'
    && (r.arrival === res.departure || r.departure === res.arrival),
  )
}

const changeoverText = computed(() => {
  if (!selected.value) return null
  const partner = findChangeoverPartner(selected.value)
  if (!partner) return null

  const arrives = partner.arrival === selected.value.departure
  const name = isFullReservation(partner) ? partner.guestName : t('calendar.anotherGuest')
  return t(arrives ? 'calendar.changeoverArrives' : 'calendar.changeoverDeparts', { name })
})

async function onDeleted() {
  await refresh()
}

// Occupancy strip lists every stay overlapping the visible calendar grid —
// including the leading/trailing days of the neighbouring months shown in the grid.
const gridStart = computed(() => startOfWeekMonday(ymd(year.value, month.value, 1)))
const gridEnd = computed(() => {
  const lastOfMonth = ymd(year.value, month.value, daysInMonth(year.value, month.value))
  return addDays(lastOfMonth, 6 - weekdayMonFirst(lastOfMonth))
})

const fullReservations = computed<FullReservation[]>(() =>
  (reservations.value ?? []).filter(isFullReservation),
)

const showOccupancy = computed(() => user.value?.role !== 'guest')
</script>

<template>
  <div class="flex-1 bg-cloud px-4 py-10 sm:px-6 sm:py-14">
    <div class="mx-auto max-w-3xl">
    <h1 class="mb-8 font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">{{ t('calendar.title') }}</h1>

    <p v-if="savedToast" class="mb-4 rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea-deep">
      {{ savedToast }}
    </p>

    <div class="rounded-2xl bg-white p-3 shadow-sm sm:p-6">
      <CalendarMonthGrid
        :year="year"
        :month="month"
        :reservations="reservations ?? []"
        @prev="prevMonth"
        @next="nextMonth"
        @select-bar="onSelectBar"
        @select-free="onSelectFree"
      />
    </div>

    <CalendarOccupancyStrip
      v-if="showOccupancy"
      :reservations="fullReservations"
      :range-start="gridStart"
      :range-end="gridEnd"
    />

    <CalendarDetailSheet
      v-if="selected"
      :reservation="selected"
      :can-manage="canManageSelected"
      :changeover-text="changeoverText"
      @close="selected = null"
      @deleted="onDeleted"
    />
    </div>
  </div>
</template>
