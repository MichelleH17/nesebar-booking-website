<script setup lang="ts">
import type { FullReservation } from '~/composables/useReservations'
import { overlaps } from '~~/shared/utils/booking'

const props = defineProps<{
  reservations: FullReservation[]
  rangeStart: string
  rangeEnd: string
}>()

const { t } = useI18n()
const { apartmentLabel } = useApartmentLabels()
const { user } = useUserSession()

function canManage(r: FullReservation): boolean {
  if (r.departure < todayStr()) return false // finished stays are read-only
  return r.userId === user.value?.id || user.value?.role === 'admin'
}

const entries = computed(() => {
  const range = { arrival: props.rangeStart, departure: addDays(props.rangeEnd, 1) }
  return props.reservations
    .filter(r => r.status === 'active' && overlaps(r, range))
    .sort((a, b) => a.arrival.localeCompare(b.arrival))
})
</script>

<template>
  <UiBaseCard class="mt-6">
    <h3 class="font-heading text-base md:text-lg font-medium text-night">{{ t('occupancy.heading') }}</h3>

    <p v-if="entries.length === 0" class="mt-3 text-sm text-stone">
      {{ t('occupancy.empty') }}
    </p>

    <ul v-else class="mt-3 flex flex-col gap-2">
      <li v-for="r in entries" :key="r.id" class="text-sm text-night">
        <component
          :is="canManage(r) ? 'button' : 'div'"
          :type="canManage(r) ? 'button' : undefined"
          class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left"
          :class="canManage(r) ? 'cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 transition hover:bg-cloud/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea' : ''"
          @click="canManage(r) && navigateTo(`/rezervace/${r.id}`)"
        >
          <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: r.user.color }" />
          <span class="font-medium">{{ r.guestName }}</span>
          <span class="text-stone">· {{ apartmentLabel(r.apartmentId) }}</span>
          <span class="text-stone">· {{ formatRangeShort(r.arrival, r.departure) }}</span>
          <span v-if="r.forGuest" class="text-stone">· {{ t('occupancy.guestOf', { name: r.user.name }) }}</span>
        </component>
      </li>
    </ul>
  </UiBaseCard>
</template>
