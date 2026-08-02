<script setup lang="ts">
withDefaults(
  defineProps<{
    imageUrl?: string
  }>(),
  {
    imageUrl: '/uploads/placeholder-1.svg',
  },
)

const { loggedIn } = useUserSession()
const { t } = useI18n()
const { st } = useSiteTexts()

const root = ref<HTMLElement | null>(null)
const image = ref<HTMLElement | null>(null)

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  const { $gsap } = useNuxtApp()
  const gsap = $gsap as typeof import('gsap').gsap

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.from('.hero-line', { y: 28, opacity: 0, duration: 0.8, stagger: 0.12 })
      .from('.hero-sub', { y: 16, opacity: 0, duration: 0.6 }, '-=0.4')
      .from('.hero-cta', { y: 16, opacity: 0, duration: 0.6 }, '-=0.35')

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

    <div class="mx-auto flex min-h-[50vh] max-w-6xl flex-col items-start justify-end gap-5 px-6 py-16 sm:px-10 sm:pb-24">
      <p class="hero-line font-sans text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
        {{ st('home.eyebrow') }}
      </p>
      <h1 class="font-heading text-5xl font-medium tracking-tight leading-[1.05] text-white sm:text-6xl">
        <span class="hero-line block">{{ st('home.line1') }}</span>
        <span class="hero-line block">{{ st('home.line2') }}</span>
      </h1>
      <p class="hero-sub max-w-xl font-sans text-lg text-white/85">
        {{ st('home.intro') }}
      </p>
      <div class="hero-cta flex flex-wrap gap-3 pt-2">
        <UiBaseButton variant="light-outline" @click="navigateTo('/okoli')">
          {{ t('common.discoverArea') }}
        </UiBaseButton>
        <UiBaseButton v-if="loggedIn" variant="light" @click="navigateTo('/rezervace/nova')">
          {{ t('common.book') }}
        </UiBaseButton>
        <UiBaseButton v-else variant="light" @click="navigateTo('/prihlaseni')">
          {{ t('common.login') }}
        </UiBaseButton>
      </div>
    </div>
  </section>
</template>
