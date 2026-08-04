<script setup lang="ts">
import type { ApartmentStat } from '~~/shared/utils/stats'

const props = defineProps<{
  perApartment: ApartmentStat[]
  year: number
}>()

// Monday-free: month number labels 1..12; season = June..September (indexes 5–8).
const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const MONTH_NAMES = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
const SEASON_MONTHS = new Set([5, 6, 7, 8])

function barHeight(a: ApartmentStat, monthIdx: number): string {
  const max = Math.max(...a.monthlyNights, 1)
  const nights = a.monthlyNights[monthIdx] ?? 0
  const pct = (nights / max) * 100
  return `${Math.max(pct, nights > 0 ? 6 : 0)}%`
}

const { apartmentLabel } = useApartmentLabels()

// Hover tooltip, same pattern as the calendar grid.
const hovered = ref<{ title: string; lines: string[]; x: number; y: number } | null>(null)

function onBarHover(a: ApartmentStat, monthIdx: number, event: MouseEvent) {
  const nights = a.monthlyNights[monthIdx] ?? 0
  const days = daysInMonth(props.year, monthIdx + 1)
  const pct = Math.round((nights / days) * 100)
  const lines = [
    nights > 0 ? `Obsazeno ${nightsLabel(nights)} z ${days}` : 'Volno celý měsíc',
  ]
  if (nights > 0) lines.push(`${pct} % měsíce`)
  if (SEASON_MONTHS.has(monthIdx)) lines.push('Hlavní sezóna')
  hovered.value = {
    title: `${MONTH_NAMES[monthIdx]} ${props.year} · ${apartmentLabel(a.apartmentId)}`,
    lines,
    x: event.clientX,
    y: event.clientY,
  }
}
function onBarLeave() {
  hovered.value = null
}

const root = useTemplateRef<HTMLElement>('root')
useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root">
    <h2 class="gs-hidden mb-4 font-heading text-2xl font-medium text-night">Obsazenost podle měsíců</h2>
    <div class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="a in perApartment"
        :key="a.apartmentId"
        class="gs-hidden occ-card rounded-2xl bg-surface p-5 shadow-sm"
      >
        <div class="mb-4 flex items-baseline justify-between">
          <h3 class="font-heading text-lg font-medium text-night">{{ apartmentLabel(a.apartmentId) }}</h3>
          <p class="text-sm text-stone">
            Sezóna <span class="font-display text-xl text-sea-deep">{{ a.seasonOccupancyPct }}%</span>
          </p>
        </div>
        <div class="flex h-32 items-stretch gap-1">
          <div
            v-for="(label, idx) in MONTH_LABELS"
            :key="idx"
            class="flex flex-1 flex-col items-center gap-1"
            @mouseenter="onBarHover(a, idx, $event)"
            @mousemove="onBarHover(a, idx, $event)"
            @mouseleave="onBarLeave"
          >
            <div class="flex w-full flex-1 items-end rounded-md" :class="SEASON_MONTHS.has(idx) ? 'bg-cloud' : 'bg-cloud/40'">
              <div
                class="w-full rounded-md transition-all"
                :class="SEASON_MONTHS.has(idx) ? 'bg-sea-deep' : 'bg-sea/50'"
                :style="{ height: barHeight(a, idx) }"
              />
            </div>
            <span class="text-[10px] text-stone">{{ label }}</span>
          </div>
        </div>
        <p class="mt-3 text-sm text-stone">{{ a.occupiedNights }} obsazených nocí celkem</p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="hovered"
        class="pointer-events-none fixed z-50 rounded-lg border border-cloud bg-white px-3 py-2 text-xs text-night shadow-lg"
        :style="{ left: `${hovered.x + 12}px`, top: `${hovered.y + 12}px` }"
      >
        <p class="font-medium">{{ hovered.title }}</p>
        <p v-for="(line, i) in hovered.lines" :key="i" class="text-stone">{{ line }}</p>
      </div>
    </Teleport>
  </section>
</template>
