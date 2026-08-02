<script setup lang="ts">
const { st } = useSiteTexts()

withDefaults(
  defineProps<{
    imageUrl?: string
  }>(),
  {
    imageUrl: '/uploads/placeholder-2.svg',
  },
)

const root = ref<HTMLElement | null>(null)
const image = ref<HTMLElement | null>(null)

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  const { $gsap } = useNuxtApp()
  const gsap = $gsap as typeof import('gsap').gsap

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.city-line', { y: 28, opacity: 0, duration: 0.8, stagger: 0.12 })
      .from('.city-sub', { y: 16, opacity: 0, duration: 0.6 }, '-=0.4')

    if (image.value) {
      gsap.fromTo(
        image.value,
        { scale: 1.05 },
        { scale: 1, duration: 1.1, ease: 'power2.out' },
      )
    }
  }, root.value ?? undefined)

  onUnmounted(() => ctx.revert())
})
</script>

<template>
  <section ref="root" class="relative isolate overflow-hidden">
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <img
        ref="image"
        :src="imageUrl"
        alt=""
        class="h-full w-full scale-105 object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-t from-night/85 via-night/35 to-night/10" />
    </div>

    <div class="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-start justify-end gap-4 px-6 py-16 sm:px-10">
      <h1 class="font-heading text-4xl font-medium tracking-tight leading-[1.05] text-white sm:text-5xl">
        <span class="city-line block">{{ st('okoli.line1') }}</span>
        <span class="city-line block">{{ st('okoli.line2') }}</span>
      </h1>
      <p class="city-sub max-w-2xl font-sans text-lg text-white/85">
        {{ st('okoli.intro') }}
      </p>
    </div>
  </section>
</template>
