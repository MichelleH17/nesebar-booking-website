<script setup lang="ts">
const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-cloud bg-surface/95 font-heading">
    <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="font-display text-lg font-semibold text-ink">
        Nesebar
      </NuxtLink>
      <p class="text-sm font-medium text-ink/70">{{ t('footer.tagline', { year }) }}</p>
    </div>
  </footer>
</template>
