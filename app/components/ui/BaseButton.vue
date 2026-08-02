<script setup lang="ts">
type Variant = 'ghost' | 'night' | 'night-outline' | 'light' | 'light-outline' | 'ocean'

const { variant = 'night', type = 'button' } = defineProps<{
  variant?: Variant
  type?: 'button' | 'submit' | 'reset'
}>()

defineEmits<{ click: [MouseEvent] }>()

const baseClasses = 'rounded-full text-xs font-semibold uppercase tracking-[0.15em]'

const variantClasses: Record<Variant, string> = {
  ghost: 'rounded-full text-sm bg-transparent text-ink hover:bg-cloud',
  night: `${baseClasses} bg-night text-white hover:bg-sea-deep`,
  'night-outline': `${baseClasses} border border-night text-night hover:bg-night hover:text-white`,
  light: `${baseClasses} bg-white text-night hover:bg-cloud`,
  'light-outline': `${baseClasses} border border-white text-white hover:bg-white/15`,
  ocean: `${baseClasses} bg-sea-deep text-white hover:bg-sea-deep/90`,
}
</script>

<template>
  <button
    :type="type"
    class="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sea focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50"
    :class="variantClasses[variant]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
