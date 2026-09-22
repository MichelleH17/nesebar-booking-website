<script setup lang="ts">
const { t } = useI18n()
useHead({ title: computed(() => t('nav.login')) })
const { st } = useSiteTexts()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)
const { fetch: refreshSession } = useUserSession()

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await refreshSession()
    await navigateTo('/kalendar')
  } catch (e: any) {
    error.value = e?.data?.message || t('login.error')
  } finally {
    loading.value = false
  }
}

const demoLoading = ref(false)
async function onDemo() {
  error.value = ''
  demoLoading.value = true
  try {
    await $fetch('/api/auth/demo', { method: 'POST' })
    await refreshSession()
    await navigateTo('/kalendar')
  } catch (e: any) {
    error.value = e?.data?.message || t('login.error')
  } finally {
    demoLoading.value = false
  }
}
</script>

<template>
  <div class="grid flex-1 bg-white lg:grid-cols-2">
    <!-- Form -->
    <div class="flex items-center justify-center px-4 py-16 sm:px-6">
      <div class="w-full max-w-sm">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-sea-deep">
          {{ st('home.eyebrow') }}
        </p>
        <h1 class="mt-3 font-heading text-4xl font-medium tracking-tight text-night sm:text-5xl">
          {{ t('login.title') }}
        </h1>
        <p class="mt-3 font-sans text-stone">
          {{ t('login.intro') }}
        </p>

        <form class="mt-8 space-y-5" @submit.prevent="onSubmit">
          <div>
            <label for="email" class="mb-1.5 block font-sans text-sm font-medium text-night">{{ t('login.email') }}</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-3 font-sans text-night transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
            >
          </div>

          <div>
            <label for="password" class="mb-1.5 block font-sans text-sm font-medium text-night">{{ t('login.password') }}</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="w-full rounded-xl border border-cloud bg-cloud/60 px-4 py-3 pr-11 font-sans text-night transition focus:border-sea-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-sea-deep"
              >
              <button
                type="button"
                :aria-label="showPassword ? t('login.hidePassword') : t('login.showPassword')"
                :aria-pressed="showPassword"
                class="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-3 text-stone hover:text-night focus:outline-none focus-visible:ring-2 focus-visible:ring-sea-deep"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.4 5.3A9.3 9.3 0 0112 5c6 0 9.5 7 9.5 7a16.5 16.5 0 01-3 3.8M6.1 6.1A16.4 16.4 0 002.5 12S6 19 12 19a9 9 0 003.9-.8" />
                </svg>
              </button>
            </div>
          </div>

          <p v-if="error" class="rounded-xl bg-red-50 px-4 py-3 font-sans text-sm text-red-700">
            {{ error }}
          </p>

          <UiBaseButton type="submit" variant="ocean" :disabled="loading">
            {{ loading ? t('login.submitting') : t('common.login') }}
          </UiBaseButton>
        </form>

        <div class="mt-4 border-t border-cloud pt-4">
          <p class="font-sans text-sm font-medium text-night">{{ t('demo.title') }}</p>
          <p class="mt-1 font-sans text-sm text-stone">{{ t('demo.intro') }}</p>
          <UiBaseButton type="button" variant="night-outline" class="mt-3" :disabled="demoLoading" @click="onDemo">
            {{ demoLoading ? t('login.submitting') : t('demo.tryButton') }}
          </UiBaseButton>
        </div>
      </div>
    </div>

    <!-- Hero-style gradient panel (desktop) -->
    <div class="relative isolate hidden overflow-hidden lg:block">
      <div class="absolute inset-0 -z-10 bg-gradient-to-br from-sea to-off-white">
        <div class="absolute inset-0 bg-gradient-to-t from-night/85 via-night/35 to-night/10" />
      </div>
      <div class="flex h-full flex-col items-start justify-end gap-4 px-10 pb-16">
        <p class="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
          {{ st('home.eyebrow') }}
        </p>
        <p class="font-heading text-4xl font-medium tracking-tight leading-[1.05] text-white xl:text-5xl">
          <span class="block">{{ st('home.line1') }}</span>
          <span class="block">{{ st('home.line2') }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
