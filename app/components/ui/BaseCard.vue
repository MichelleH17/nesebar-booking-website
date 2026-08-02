<script setup lang="ts">
withDefaults(
  defineProps<{
    hover?: boolean
  }>(),
  {
    hover: false,
  },
)
</script>

<template>
  <div
    class="rounded-2xl bg-surface p-6 shadow-sm transition duration-200"
    :class="hover ? 'hover:-translate-y-1 hover:shadow-md' : ''"
  >
    <slot />
  </div>
</template>
