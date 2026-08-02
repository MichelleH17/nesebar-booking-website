<script setup lang="ts">
import { nights } from '~~/shared/utils/booking'
import { isFullReservation } from '~/composables/useReservations'
import type { Reservation, FullReservation } from '~/composables/useReservations'

const { reservations, refresh } = useReservations()

// Inside <ClientOnly> the initial useFetch can be skipped during hydration — fetch explicitly.
onMounted(() => {
  if (!(reservations.value ?? []).length) refresh()
})
const { apartmentLabel } = useApartmentLabels()

const rows = computed<FullReservation[]>(() =>
  (reservations.value ?? [])
    .filter(isFullReservation)
    .sort((a, b) => b.arrival.localeCompare(a.arrival)),
)

function edit(r: Reservation) {
  navigateTo(`/rezervace/${r.id}`)
}

async function cancel(r: FullReservation) {
  if (!confirm(`Zrušit rezervaci ${r.guestName} (${r.arrival} – ${r.departure})?`)) return
  await $fetch(`/api/reservations/${r.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="overflow-x-auto rounded-2xl bg-surface shadow-sm">
    <table class="w-full min-w-[640px] text-left text-sm">
      <thead class="border-b border-cloud text-stone">
        <tr>
          <th class="px-4 py-3 font-medium">Byt</th>
          <th class="px-4 py-3 font-medium">Host</th>
          <th class="px-4 py-3 font-medium">Termín</th>
          <th class="px-4 py-3 font-medium">Nocí</th>
          <th class="px-4 py-3 font-medium">Lidé</th>
          <th class="px-4 py-3 font-medium">Cena</th>
          <th class="px-4 py-3 font-medium">Akce</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="r in rows"
          :key="r.id"
          class="border-b border-cloud/50"
          :class="r.status === 'cancelled' ? 'text-stone' : 'text-night'"
        >
          <td class="px-4 py-3">{{ apartmentLabel(r.apartmentId) }}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center gap-2">
              <span class="inline-block h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: r.user.color }" />
              {{ r.guestName }}
            </span>
            <span v-if="r.status === 'cancelled'" class="ml-1 text-xs">(zrušeno)</span>
            <span v-if="r.forGuest" class="block text-xs text-stone">host - zodpovídá {{ r.user.name }}</span>
          </td>
          <td class="px-4 py-3 whitespace-nowrap">{{ formatRangeShort(r.arrival, r.departure) }}</td>
          <td class="px-4 py-3">{{ nights(r.arrival, r.departure) }}</td>
          <td class="px-4 py-3">{{ r.people }}</td>
          <td class="px-4 py-3 whitespace-nowrap">{{ r.priceApplied === null ? 'zdarma' : `${r.priceApplied} Kč` }}</td>
          <td class="px-4 py-3">
            <div v-if="r.status === 'active'" class="flex gap-2">
              <button type="button" class="rounded-lg bg-cloud px-3 py-1 text-xs text-night" @click="edit(r)">Upravit</button>
              <button type="button" class="rounded-lg px-3 py-1 text-xs text-red-700 hover:bg-red-50" @click="cancel(r)">Zrušit</button>
            </div>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td colspan="7" class="px-4 py-8 text-center text-stone">Zatím žádné rezervace.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
