<script setup lang="ts">
import type { GuideItem } from '~~/shared/types/guideItem'

const { t } = useI18n()
const loc = useLocalizedContent()

defineProps<{
  items: GuideItem[]
}>()

const root = useTemplateRef<HTMLElement>('root')
const openId = ref<number | null>(null)

function toggle(id: number) {
  openId.value = openId.value === id ? null : id
}

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section v-if="items.length" ref="root" class="bg-cloud px-4 py-10 sm:px-6 md:py-16 lg:py-20">
    <div class="mx-auto max-w-3xl">
    <h2 class="gs-hidden font-heading text-3xl font-medium tracking-tight text-night sm:text-4xl">
      {{ t('info.heading') }}
    </h2>
    <div class="mt-8 flex flex-col gap-3">
      <div
        v-for="item in items"
        :key="item.id"
        class="gs-hidden info-row overflow-hidden rounded-2xl bg-white"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sea-deep focus-visible:ring-inset"
          :aria-expanded="openId === item.id"
          @click="toggle(item.id)"
        >
          <span class="font-heading text-lg font-medium text-night">{{ loc(item, 'title') }}</span>
          <svg
            class="h-5 w-5 shrink-0 text-sea-deep transition-transform duration-200 motion-reduce:transition-none"
            :class="openId === item.id ? 'rotate-180' : ''"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path d="m5 8 5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div
          class="grid transition-all duration-300 ease-out motion-reduce:transition-none"
          :class="openId === item.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
        >
          <div class="overflow-hidden">
            <p class="px-5 pb-5 font-sans text-sm text-stone">
              {{ loc(item, 'description') }}
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  </section>
</template>
