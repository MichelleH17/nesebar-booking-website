<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const { t, locale, setLocale } = useI18n()

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

async function logout() {
  await clear()
  closeMenu()
  await navigateTo('/')
}

const canSeeOverview = computed(() => user.value?.role === 'family' || user.value?.role === 'admin')
const isAdmin = computed(() => user.value?.role === 'admin')
const isDemo = computed(() => user.value?.role === 'demo')

// Language switching hidden for now (site is Czech-only in practice).
const showLanguageSwitch = false
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-cloud bg-surface/95 font-heading backdrop-blur">
    <div
      v-if="isDemo"
      class="bg-sea-deep px-4 py-1.5 text-center font-sans text-xs font-medium text-white"
    >
      {{ t('demo.banner') }}
    </div>
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <NuxtLink to="/" class="font-display text-lg font-semibold text-ink" @click="closeMenu">
        Nesebar
      </NuxtLink>

      <div class="flex items-center gap-3 sm:gap-5">
        <!-- Language (desktop) -->
        <div v-if="showLanguageSwitch" class="hidden items-center gap-1 text-xs font-semibold sm:flex" role="group" :aria-label="t('nav.language')">
          <button
            type="button"
            class="rounded px-1.5 py-0.5 transition"
            :class="locale === 'cs' ? 'text-ink/60 underline decoration-sea-deep decoration-2 underline-offset-4' : 'text-ink/50 hover:text-ink'"
            :aria-pressed="locale === 'cs'"
            @click="setLocale('cs')"
          >
            CS
          </button>
          <span class="text-ink/30">/</span>
          <button
            type="button"
            class="rounded px-1.5 py-0.5 transition"
            :class="locale === 'en' ? 'text-ink/60 underline decoration-sea-deep decoration-2 underline-offset-4' : 'text-ink/50 hover:text-ink'"
            :aria-pressed="locale === 'en'"
            @click="setLocale('en')"
          >
            EN
          </button>
        </div>

        <!-- Primary links (desktop) -->
        <nav v-if="loggedIn" class="hidden items-center gap-5 sm:flex" :aria-label="t('nav.aria')">
          <NuxtLink to="/kalendar" class="text-sm font-medium text-ink hover:text-sea-deep" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.kalendar') }}</NuxtLink>
          <NuxtLink to="/rezervace/nova" class="text-sm font-medium text-ink hover:text-sea-deep" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.rezervovat') }}</NuxtLink>
          <NuxtLink v-if="isAdmin" to="/admin" class="text-sm font-medium text-ink hover:text-sea-deep" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.admin') }}</NuxtLink>
        </nav>

        <!-- User (desktop) -->
        <div v-if="loggedIn" class="hidden items-center gap-2 text-sm text-ink sm:flex">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: user?.color }"
          />
          {{ user?.name }}
        </div>

        <!-- Primary action (desktop) -->
        <UiBaseButton v-if="loggedIn" variant="night-outline" class="hidden sm:inline-flex" @click="logout">{{ t('nav.odhlasit') }}</UiBaseButton>
        <NuxtLink v-else to="/prihlaseni" class="hidden sm:block" @click="closeMenu">
          <UiBaseButton variant="ocean">{{ t('nav.prihlasit') }}</UiBaseButton>
        </NuxtLink>

        <!-- Hamburger (all viewports) -->
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full p-2 text-ink hover:bg-cloud focus:outline-none focus-visible:ring-2 focus-visible:ring-sea"
          :aria-expanded="menuOpen"
          aria-controls="site-menu"
          :aria-label="menuOpen ? t('nav.closeMenu') : t('nav.openMenu')"
          @click="toggleMenu"
        >
          <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Hamburger menu: right-aligned panel (max half width), secondary links plus everything on mobile -->
    <div v-if="menuOpen" id="site-menu" class="absolute right-4 top-full mt-2 w-1/2 max-w-xs rounded-2xl border border-cloud bg-surface p-6 shadow-lg sm:right-6">
      <div class="flex flex-col gap-5">
        <!-- Mobile-only: user first, then primary links -->
        <div v-if="loggedIn" class="flex items-center gap-2 text-sm font-medium text-ink sm:hidden">
          <span
            class="inline-block h-2.5 w-2.5 rounded-full"
            :style="{ backgroundColor: user?.color }"
          />
          {{ user?.name }}
        </div>
        <NuxtLink v-if="isAdmin" to="/admin" class="text-sm font-medium text-ink hover:text-sea-deep sm:hidden" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.admin') }}</NuxtLink>
        <NuxtLink v-if="isAdmin" to="/admin/design" class="text-sm font-medium text-ink hover:text-sea-deep" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.designSystem') }}</NuxtLink>
        <template v-if="loggedIn">
          <NuxtLink to="/kalendar" class="text-sm font-medium text-ink sm:hidden" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.kalendar') }}</NuxtLink>
          <NuxtLink to="/rezervace/nova" class="text-sm font-medium text-ink sm:hidden" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.rezervovat') }}</NuxtLink>
        </template>

        <NuxtLink to="/okoli" class="text-sm font-medium text-ink hover:text-sea-deep" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.okoli') }}</NuxtLink>
        <NuxtLink v-if="canSeeOverview" to="/prehled" class="text-sm font-medium text-ink hover:text-sea-deep" active-class="underline decoration-sea-deep decoration-2 underline-offset-4" @click="closeMenu">{{ t('nav.prehled') }}</NuxtLink>

        <div v-if="showLanguageSwitch" class="flex items-center gap-2 border-t border-cloud pt-3 text-xs font-semibold sm:hidden" role="group" :aria-label="t('nav.language')">
          <button
            type="button"
            class="rounded px-1.5 py-0.5 transition"
            :class="locale === 'cs' ? 'text-ink/50 underline decoration-sea-deep decoration-2 underline-offset-4' : 'text-ink/50'"
            :aria-pressed="locale === 'cs'"
            @click="setLocale('cs')"
          >
            CS
          </button>
          <span class="text-ink/30">·</span>
          <button
            type="button"
            class="rounded px-1.5 py-0.5 transition"
            :class="locale === 'en' ? 'text-ink/50 underline decoration-sea-deep decoration-2 underline-offset-4' : 'text-ink/50'"
            :aria-pressed="locale === 'en'"
            @click="setLocale('en')"
          >
            EN
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
