<script setup lang="ts">
import type { Apartment } from '~~/shared/types/apartment'

defineProps<{
  apartments: Apartment[]
}>()

const { loggedIn } = useUserSession()
const { t } = useI18n()
const { st } = useSiteTexts()
const loc = useLocalizedContent()
const NuxtLink = resolveComponent('NuxtLink')

const root = ref<HTMLElement | null>(null)

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root" class="bg-white px-6 py-10 md:py-16 lg:py-20 sm:px-10">
    <div class="mx-auto max-w-6xl">
      <h2 class="gs-hidden font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">
        {{ st('home.apartmentsHeading') }}
      </h2>
      <div class="mt-10 grid gap-6 sm:grid-cols-2">
        <component
          :is="loggedIn ? NuxtLink : 'div'"
          v-for="apartment in apartments"
          :key="apartment.id"
          v-bind="loggedIn ? { to: '/kalendar' } : {}"
          class="gs-hidden apartment-card block"
        >
          <div
            class="h-full rounded-2xl bg-cloud p-8 sm:p-10"
            :class="loggedIn ? 'transition duration-200 hover:-translate-y-1 hover:shadow-md' : ''"
          >
            <h3 class="font-heading text-2xl font-medium tracking-tight text-night">
              {{ loc(apartment, 'name') }}
            </h3>
            <p class="mt-3 font-sans text-stone">
              {{ loc(apartment, 'description') }}
            </p>
            <p class="mt-6 font-sans text-xs font-medium uppercase tracking-[0.15em] text-sea-deep">
              {{ t('apartments.upTo', { count: apartment.capacity }) }}
            </p>
            <p v-if="loggedIn" class="mt-2 font-sans text-xs font-medium uppercase tracking-[0.15em] text-sea-deep">
              {{ t('apartments.viewAvailability') }}
            </p>
          </div>
        </component>
      </div>
    </div>
  </section>
</template>
