<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { user } = useUserSession()
const { t } = useI18n()

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const apartmentId = route.query.apartment === '16B' ? '16B' : '15B'
const arrival = typeof route.query.arrival === 'string' && DATE_RE.test(route.query.arrival)
  ? route.query.arrival
  : ''
const departure = arrival ? addDays(arrival, 1) : ''

const initial = {
  apartmentId,
  guestName: user.value?.name ?? '',
  people: 2,
  arrival,
  departure,
  travelMethod: 'car' as const,
  notes: '',
  priceApplied: null,
  forGuest: false,
  notifyEmails: [] as string[],
}

// Guests pay by default; family stays are free by default.
const defaultPaid = user.value?.role === 'guest'
</script>

<template>
  <div class="min-h-[calc(100vh-8rem)] bg-cloud px-4 py-10 sm:px-6 sm:py-14">
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-8 font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">{{ t('reservation.newTitle') }}</h1>
      <div class="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <ReservationForm mode="new" :initial="initial" :default-paid="defaultPaid" />
      </div>
    </div>
  </div>
</template>
