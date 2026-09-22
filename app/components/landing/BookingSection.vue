<script setup lang="ts">
const { t } = useI18n()

const root = useTemplateRef<HTMLElement>('root')

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})

const features = [
  { title: 'booking.feature1Title', text: 'booking.feature1Text' },
  { title: 'booking.feature2Title', text: 'booking.feature2Text' },
  { title: 'booking.feature3Title', text: 'booking.feature3Text' },
]
</script>

<template>
  <section ref="root" class="bg-white px-4 py-10 sm:px-6 md:py-16 lg:py-20">
    <div class="mx-auto max-w-6xl">
      <h2 class="gs-hidden font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">
        {{ t('booking.heading') }}
      </h2>
      <p class="gs-hidden mt-3 max-w-xl font-sans text-stone">
        {{ t('booking.intro') }}
      </p>
      <p class="gs-hidden mt-2 max-w-xl font-sans text-stone">
        {{ t('booking.text') }}
      </p>
      <div class="mt-10 grid gap-6 sm:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="gs-hidden rounded-2xl bg-cloud p-8 sm:p-10"
        >
          <h3 class="font-heading text-2xl font-medium tracking-tight text-night">
            {{ t(feature.title) }}
          </h3>
          <p class="mt-3 font-sans text-stone">
            {{ t(feature.text) }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
