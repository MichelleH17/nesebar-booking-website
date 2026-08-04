<script setup lang="ts">
import { isFullReservation } from '~/composables/useReservations'
import type { Reservation } from '~/composables/useReservations'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
useHead({ title: computed(() => t('detail.title')) })

const route = useRoute()
const { user } = useUserSession()
const id = Number(route.params.id)

const { data: reservations } = await useFetch<Reservation[]>('/api/reservations', { default: () => [] })
const reservation = computed(() => (reservations.value ?? []).find(r => r.id === id))

const canEdit = computed(() => {
  const r = reservation.value
  if (!r || !isFullReservation(r)) return false
  if (r.departure < todayStr()) return false // finished stays are read-only
  return r.userId === user.value?.id || user.value?.role === 'admin'
})

// Client-side ownership guard (server enforces it too on PATCH).
if (!canEdit.value) {
  await navigateTo('/kalendar')
}

const initial = computed(() => {
  const r = reservation.value
  if (!r || !isFullReservation(r)) return null
  return {
    apartmentId: r.apartmentId,
    guestName: r.guestName,
    people: r.people,
    arrival: r.arrival,
    departure: r.departure,
    travelMethod: r.travelMethod,
    notes: r.notes,
    priceApplied: r.priceApplied,
    forGuest: r.forGuest ?? false,
    notifyEmails: r.notifyEmails ?? [],
  }
})
</script>

<template>
  <div class="flex-1 bg-cloud px-4 py-10 sm:px-6 sm:py-14">
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-8 font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">{{ t('reservation.editTitle') }}</h1>
      <div class="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <ReservationForm v-if="initial" mode="edit" :initial="initial" :reservation-id="id" />
      </div>
    </div>
  </div>
</template>
