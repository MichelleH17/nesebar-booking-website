<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string | null
    roundedLeft?: boolean
    roundedRight?: boolean
    anonymized?: boolean
    ariaLabel: string
    clickable?: boolean
  }>(),
  {
    color: null,
    roundedLeft: false,
    roundedRight: false,
    anonymized: false,
    clickable: false,
  },
)

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    v-if="clickable"
    type="button"
    class="h-2.5 min-w-0 flex-1 cursor-pointer transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-1"
    :class="[
      roundedLeft ? 'rounded-l-full' : '',
      roundedRight ? 'rounded-r-full' : '',
      anonymized ? 'bg-silver' : '',
    ]"
    :style="!anonymized && color ? { backgroundColor: color } : undefined"
    :aria-label="ariaLabel"
    @click="$emit('click')"
  />
  <div
    v-else
    class="h-2.5 min-w-0 flex-1"
    :class="[
      roundedLeft ? 'rounded-l-full' : '',
      roundedRight ? 'rounded-r-full' : '',
      anonymized ? 'bg-silver' : '',
    ]"
    :style="!anonymized && color ? { backgroundColor: color } : undefined"
    role="img"
    :aria-label="ariaLabel"
  />
</template>
