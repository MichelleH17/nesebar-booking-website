<script setup lang="ts">
import type { Weather } from '~~/shared/types/weather'

const { t, locale } = useI18n()

const props = withDefaults(
  defineProps<{
    weather: Weather
    home?: boolean
  }>(),
  { home: false },
)

const root = useTemplateRef<HTMLElement>('root')

const hasData = computed(() => props.weather.current !== null || props.weather.daily.length > 0)
const days = computed(() => props.weather.daily.slice(0, 6))

const round = (n: number) => Math.round(n)

function weekday(date: string) {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'cs-CZ', { weekday: 'short' })
}

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root" class="bg-white px-4 py-10 sm:px-6 md:py-16 lg:py-20">
    <div class="mx-auto max-w-175 rounded-2xl bg-cloud p-8 sm:p-12">
      <h2
        class="gs-hidden weather-reveal font-heading font-medium tracking-tight text-night"
        :class="home ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'"
      >
        {{ t('weather.heading') }}
      </h2>

      <div
        v-if="hasData"
        class="gs-hidden weather-reveal mt-8"
      >
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div v-if="weather.current">
            <p class="font-sans text-sm text-stone">
              {{ t('weather.now') }}
            </p>
            <p class="font-display text-3xl md:text-6xl leading-none text-night">
              {{ round(weather.current.temp) }}°
            </p>
          </div>

          <div v-if="weather.sea !== null">
            <p class="font-sans text-sm text-stone">
              {{ t('weather.seaTemp') }}
            </p>
            <div class="flex items-center gap-3">
            <svg class="h-8 md:h-10 w-8 md:w-10 text-sea-deep" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M2 12c3 0 3 3 6 3s3-3 6-3 3 3 6 3 3-3 6-3 3 3 6 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M2 19c3 0 3 3 6 3s3-3 6-3 3 3 6 3 3-3 6-3 3 3 6 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M2 26c3 0 3 3 6 3s3-3 6-3 3 3 6 3 3-3 6-3 3 3 6 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>


              <p class="font-display text-3xl md:text-6xl text-sea-deep">
                {{ round(weather.sea) }}°
              </p>
            </div>
          </div>
        </div>

        <div v-if="days.length" class="mt-8 grid grid-cols-2 gap-2 border-t border-cloud pt-6 sm:grid-cols-3 md:grid-cols-6">
          <div
            v-for="day in days"
            :key="day.date"
            class="mx-auto flex w-full max-w-3xs items-center justify-between gap-1 rounded-2xl border border-cloud bg-white px-4 py-3 text-center sm:max-w-none sm:flex-col sm:justify-center sm:px-2"
          >
            <span class="font-sans text-sm font-medium uppercase text-stone">{{ weekday(day.date) }}</span>
            <span class="font-sans text-sm font-semibold text-night">{{ round(day.max) }}°</span>
            <span class="font-sans text-sm text-stone">{{ round(day.min) }}°</span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="gs-hidden weather-reveal mt-8 text-center"
      >
        <p class="font-sans text-stone">
          {{ t('weather.error') }}
        </p>
      </div>
    </div>
  </section>
</template>
