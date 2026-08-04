<script setup lang="ts">
import type { Stats } from '~~/shared/utils/stats'

definePageMeta({ middleware: 'auth' })

const { user } = useUserSession()
// Stats are family/admin only (server enforces it too via requireFamily).
if (user.value?.role === 'guest') {
  await navigateTo('/kalendar')
}

const year = ref(new Date().getFullYear())

const { data: stats } = await useFetch<Stats>('/api/stats', {
  query: { year },
  default: () => ({ perUser: [], friends: { stays: 0, nights: 0, paidTotal: 0, list: [] }, perApartment: [] }),
})
</script>

<template>
  <div class="flex-1 bg-cloud px-4 py-10 sm:px-6 sm:py-14">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8 flex items-center justify-between">
        <h1 class="font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">Přehled</h1>
        <div class="flex items-center gap-2">
          <button type="button" aria-label="Předchozí rok" class="h-9 w-9 rounded-full bg-white text-night shadow-sm transition hover:bg-white/80" @click="year--">‹</button>
          <span class="w-14 text-center font-heading text-lg font-medium text-night">{{ year }}</span>
          <button type="button" aria-label="Další rok" class="h-9 w-9 rounded-full bg-white text-night shadow-sm transition hover:bg-white/80" @click="year++">›</button>
        </div>
      </div>

      <div class="space-y-12">
        <DashboardPersonStats :per-user="stats.perUser" :friends="stats.friends" />
        <DashboardOccupancyBars :per-apartment="stats.perApartment" :year="year" />
        <DashboardSeasonGaps :per-apartment="stats.perApartment" />
      </div>
    </div>
  </div>
</template>
