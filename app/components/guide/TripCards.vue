<script setup lang="ts">
import type { GuideItem } from '~~/shared/types/guideItem'

const { t } = useI18n()
const loc = useLocalizedContent()

defineProps<{
  trips: GuideItem[]
}>()

const root = useTemplateRef<HTMLElement>('root')

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section v-if="trips.length" ref="root" class="bg-white">
    <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-16 lg:py-20">
      <h2 class="gs-hidden font-heading text-3xl font-medium tracking-tight text-night sm:text-4xl">
        {{ t('trips.heading') }}
      </h2>
      <p class="gs-hidden mt-3 max-w-xl font-sans text-stone">
        {{ t('trips.intro') }}
      </p>
      <div class="mt-8 grid gap-6 sm:grid-cols-2">
        <article
          v-for="trip in trips"
          :key="trip.id"
          class="gs-hidden trip-card overflow-hidden rounded-2xl border border-cloud bg-white"
        >
          <div class="aspect-[4/3] overflow-hidden bg-cloud">
            <img
              :src="trip.imageUrl ?? '/uploads/placeholder-trip.svg'"
              :alt="loc(trip, 'title')"
              class="h-full w-full object-cover"
            >
          </div>
          <div class="p-5">
            <h3 class="font-heading text-xl font-medium text-night">
              {{ loc(trip, 'title') }}
            </h3>
            <p
              v-if="trip.meta"
              class="mt-1 flex items-center gap-1.5 font-sans text-xs font-semibold text-sea-deep"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2C6.7 2 4 4.7 4 8c0 4.2 6 10 6 10s6-5.8 6-10c0-3.3-2.7-6-6-6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
                <circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
              </svg>
              {{ loc(trip, 'meta') }}
            </p>
            <p class="mt-2 font-sans text-sm text-stone">
              {{ loc(trip, 'description') }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
