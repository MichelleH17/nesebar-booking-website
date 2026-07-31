import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['nuxt-auth-utils', '@nuxt/fonts', '@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'gsap',
        'gsap/ScrollTrigger',
      ],
    },
  },
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'cs',
    locales: [
      { code: 'cs', language: 'cs-CZ', name: 'Čeština', file: 'cs.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'nessebar_locale',
    },
  },
  runtimeConfig: {
    sessionPassword: '', // NUXT_SESSION_PASSWORD
    smtpHost: '',        // NUXT_SMTP_HOST
    smtpPort: '465',     // NUXT_SMTP_PORT
    smtpUser: '',        // NUXT_SMTP_USER
    smtpPass: '',        // NUXT_SMTP_PASS
    mailTo: '', // NUXT_MAIL_TO
  },
})