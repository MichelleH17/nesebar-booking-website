<script setup lang="ts">
import { nights } from '~~/shared/utils/booking'
import type { FullReservation } from '~/composables/useReservations'

const props = defineProps<{
  reservation: FullReservation
  canManage: boolean
  changeoverText: string | null
}>()

const emit = defineEmits<{
  close: []
  deleted: []
}>()

const { t, locale } = useI18n()
const { apartmentLabel } = useApartmentLabels()

const TRAVEL_ICONS: Record<string, string> = {
  car: '🚗',
  plane: '✈️',
  bus: '🚌',
  train: '🚆',
}

const nightsCount = computed(() => nights(props.reservation.arrival, props.reservation.departure))
const priceLabel = computed(() =>
  props.reservation.priceApplied === null
    ? t('detail.priceFree')
    : t('detail.priceValue', { amount: props.reservation.priceApplied }),
)

const cancelling = ref(false)

async function onCancel() {
  if (!confirm(t('detail.confirmCancel'))) return
  cancelling.value = true
  try {
    await $fetch(`/api/reservations/${props.reservation.id}`, { method: 'DELETE' })
    emit('deleted')
    emit('close')
  } finally {
    cancelling.value = false
  }
}

function onEdit() {
  navigateTo(`/rezervace/${props.reservation.id}`)
}

function onIcal() {
  window.location.href = `/api/reservations/${props.reservation.id}/ical`
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-end justify-center md:items-center md:justify-end md:pr-6">
    <div class="absolute inset-0 bg-night/40" @click="emit('close')" />

    <div
      class="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-lg md:max-w-sm md:rounded-2xl"
      role="dialog"
      aria-modal="true"
    >
      <div class="mb-4 flex items-start justify-between">
        <div class="flex items-center gap-2">
          <span class="inline-block h-3 w-3 rounded-full" :style="{ backgroundColor: reservation.user.color }" />
          <h3 class="font-heading text-lg font-medium text-night">{{ reservation.guestName }}</h3>
        </div>
        <button type="button" :aria-label="t('detail.close')" class="rounded-full p-1 text-stone hover:bg-cloud" @click="emit('close')">
          ✕
        </button>
      </div>

      <p class="text-sm text-stone">{{ apartmentLabel(reservation.apartmentId) }}</p>

      <dl class="mt-4 space-y-2 text-sm text-night">
        <div class="flex justify-between">
          <dt class="text-stone">{{ t('detail.range') }}</dt>
          <dd>{{ formatLong(reservation.arrival, locale as 'cs' | 'en') }} – {{ formatLong(reservation.departure, locale as 'cs' | 'en') }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-stone">{{ t('detail.nightsCount') }}</dt>
          <dd>{{ nightsCount }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-stone">{{ t('detail.peopleCount') }}</dt>
          <dd>{{ reservation.people }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-stone">{{ t('detail.travel') }}</dt>
          <dd>{{ TRAVEL_ICONS[reservation.travelMethod] }} {{ t('travelPast.' + reservation.travelMethod) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-stone">{{ t('detail.price') }}</dt>
          <dd>{{ priceLabel }}</dd>
        </div>
        <div v-if="reservation.forGuest" class="flex justify-between">
          <dt class="text-stone">{{ t('detail.responsible') }}</dt>
          <dd>{{ reservation.user.name }}</dd>
        </div>
        <div v-if="reservation.notes">
          <dt class="text-stone">{{ t('detail.notes') }}</dt>
          <dd class="mt-1">{{ reservation.notes }}</dd>
        </div>
      </dl>

      <p v-if="changeoverText" class="mt-4 rounded-xl bg-sea/10 px-4 py-3 text-sm text-sea-deep">
        {{ changeoverText }}
      </p>

      <div class="mt-6 flex flex-wrap gap-2">
        <UiBaseButton variant="ocean" @click="onIcal">{{ t('detail.addToCalendar') }}</UiBaseButton>
        <template v-if="canManage">
          <UiBaseButton variant="ghost" @click="onEdit">{{ t('detail.edit') }}</UiBaseButton>
          <UiBaseButton variant="ghost" :disabled="cancelling" @click="onCancel">{{ t('detail.cancel') }}</UiBaseButton>
        </template>
      </div>
    </div>
  </div>
</template>
