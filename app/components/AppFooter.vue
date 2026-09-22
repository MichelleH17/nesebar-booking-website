<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-cloud bg-surface/95 font-heading">
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <p class="font-sans text-sm font-medium text-night">{{ t('footer.about') }}</p>
      <p class="mt-1.5 max-w-xl font-sans text-sm text-stone">{{ t('footer.aboutText') }}</p>
    </div>
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-cloud px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="font-display text-lg font-semibold text-ink">
        Nesebar
      </NuxtLink>
      <p class="text-sm font-medium text-ink/70">{{ t('footer.label') }}</p>
    </div>
  </footer>
</template>
