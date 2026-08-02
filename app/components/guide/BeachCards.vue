<script setup lang="ts">
import type { GuideItem } from '~~/shared/types/guideItem'

const { t } = useI18n()
const loc = useLocalizedContent()

defineProps<{
  beaches: GuideItem[]
}>()

const root = ref<HTMLElement | null>(null)

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section v-if="beaches.length" ref="root" class="bg-white px-6 py-10 md:py-16 lg:py-20 sm:px-10">
    <div class="mx-auto max-w-6xl">
    <h2 class="gs-hidden font-heading text-3xl font-medium tracking-tight text-night sm:text-4xl">
      {{ t('beaches.heading') }}
    </h2>
    <p class="gs-hidden mt-3 max-w-xl font-sans text-stone">
      {{ t('beaches.intro') }}
    </p>
    <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="beach in beaches"
        :key="beach.id"
        class="gs-hidden beach-card overflow-hidden rounded-2xl border border-cloud bg-white"
      >
        <div class="aspect-[4/3] overflow-hidden bg-cloud">
          <img
            :src="beach.imageUrl ?? '/uploads/placeholder-beach.svg'"
            :alt="loc(beach, 'title')"
            class="h-full w-full object-cover"
          >
        </div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-3">
            <h3 class="font-heading text-xl font-medium text-night">
              {{ loc(beach, 'title') }}
            </h3>
            <span
              v-if="beach.meta"
              class="shrink-0 rounded-full bg-sea-deep/10 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-sea-deep"
            >
              {{ loc(beach, 'meta') }}
            </span>
          </div>
          <p class="mt-2 font-sans text-sm text-stone">
            {{ loc(beach, 'description') }}
          </p>
        </div>
      </article>
    </div>
    </div>
  </section>
</template>
