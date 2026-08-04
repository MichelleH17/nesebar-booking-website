<script setup lang="ts">
const { loggedIn } = useUserSession()
const { t } = useI18n()
const { st } = useSiteTexts()

const root = useTemplateRef<HTMLElement>('root')

useScrollAnimations(root, ({ revealUp }) => {
  revealUp('.gs-hidden', root.value)
})
</script>

<template>
  <section ref="root" class="relative isolate overflow-hidden">
    <!-- Same look as the hero: its image gradient (sea → light) + identical dark overlay, minus the baked-in text -->
    <div class="absolute inset-0 -z-10 bg-gradient-to-br from-sea to-off-white">
      <div class="absolute inset-0 bg-gradient-to-t from-night/85 via-night/35 to-night/10" />
    </div>

    <div class="mx-auto max-w-6xl px-6 py-10 md:py-16 lg:py-20 sm:px-10">
      <div class="gs-hidden cta-content mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
      <h2 class="font-heading text-4xl font-medium tracking-tight text-white sm:text-5xl">
        {{ st('home.ctaHeading') }}
      </h2>
      <p class="max-w-xl font-sans text-white/85">
        {{ st(loggedIn ? 'home.ctaIntroLoggedIn' : 'home.ctaIntroGuest') }}
      </p>
      <div class="flex flex-wrap justify-center gap-3 pt-2">
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
    </div>
  </section>
</template>
