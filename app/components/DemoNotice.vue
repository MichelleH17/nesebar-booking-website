<script setup lang="ts">
const { message } = useDemoNotice()
</script>

<template>
  <Transition name="demo-notice">
    <div
      v-if="message"
      role="status"
      aria-live="polite"
      class="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-night px-5 py-3 text-center font-sans text-sm font-medium text-white shadow-lg"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.demo-notice-enter-active,
.demo-notice-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.demo-notice-enter-from,
.demo-notice-leave-to {
  opacity: 0;
  transform: translateY(0.75rem);
}
</style>
