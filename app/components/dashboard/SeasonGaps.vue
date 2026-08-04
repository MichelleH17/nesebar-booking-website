<script setup lang="ts">
import type { ApartmentStat, SeasonGap } from '~~/shared/utils/stats'

const props = defineProps<{
  perApartment: ApartmentStat[]
}>()

const { apartmentLabel } = useApartmentLabels()

const hasAnyGap = computed(() => props.perApartment.some(a => a.seasonGaps.length > 0))

// A free window opens the reservation form prefilled — like clicking a free day in the calendar.
// Gaps fully in the past stay plain text; a partly-past gap starts the stay today.
const today = todayStr()

function bookable(g: SeasonGap): boolean {
  return g.to > today
}

function bookGap(apartmentId: string, g: SeasonGap) {
  const arrival = g.from > today ? g.from : today
  navigateTo(`/rezervace/nova?apartment=${apartmentId}&arrival=${arrival}&zpet=prehled`)
}

const root = useTemplateRef<HTMLElement>('root')
useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root">
    <h2 class="gs-hidden mb-4 font-heading text-2xl font-medium text-night">Volno v hlavní sezóně</h2>

    <p v-if="!hasAnyGap" class="gs-hidden gap-card rounded-2xl bg-surface p-6 text-center text-stone shadow-sm">
      Léto je plné 🎉
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="a in perApartment"
        :key="a.apartmentId"
        class="gs-hidden gap-card rounded-2xl bg-surface p-5 shadow-sm"
      >
        <h3 class="mb-3 font-heading text-lg font-medium text-night">{{ apartmentLabel(a.apartmentId) }}</h3>
        <ul v-if="a.seasonGaps.length" class="space-y-2 text-sm text-night">
          <li v-for="(g, i) in a.seasonGaps" :key="i">
            <component
              :is="bookable(g) ? 'button' : 'div'"
              :type="bookable(g) ? 'button' : undefined"
              class="flex w-full items-center justify-between gap-3 text-left"
              :class="bookable(g) ? 'cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 transition hover:bg-cloud/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea' : ''"
              @click="bookable(g) && bookGap(a.apartmentId, g)"
            >
              <span>{{ formatRangeShort(g.from, g.to) }}</span>
              <span class="text-stone">{{ g.nights }} nocí volných</span>
            </component>
          </li>
        </ul>
        <p v-else class="text-sm text-stone">Obsazeno celé léto 🎉</p>
      </div>
    </div>
  </section>
</template>
