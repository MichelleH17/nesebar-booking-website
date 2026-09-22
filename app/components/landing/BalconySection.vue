<script setup lang="ts">
const { t } = useI18n()

const root = useTemplateRef<HTMLElement>('root')

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root" class="bg-cloud px-4 py-10 sm:px-6 md:py-16 lg:py-20">
    <div class="mx-auto max-w-3xl text-center">
      <h2 class="gs-hidden font-heading text-3xl font-medium tracking-tight text-night sm:text-4xl">
        {{ t('balcony.heading') }}
      </h2>
      <p class="gs-hidden mt-4 font-sans text-stone">
        {{ t('balcony.text') }}
      </p>
    </div>
  </section>
</template>
