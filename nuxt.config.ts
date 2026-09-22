import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Nesebar',
      meta: [
        { name: 'description', content: 'Rezervace apartmánů v Nesebaru.' },
        { name: 'robots', content: 'noindex, nofollow' }, // private family site
        { name: 'theme-color', content: '#0D0F19' },
      ],
      link: [{ rel: 'icon', href: '/favicon.ico', sizes: 'any' }],
    },
  },
  modules: ['nuxt-auth-utils', '@nuxt/fonts', '@nuxtjs/i18n'],
  nitro: {
    // The default @libsql/client entry requires a native binary Nitro can't trace
    // into the serverless bundle. Production always talks to Turso over HTTP, so
    // build against the pure-JS client; dev keeps the native one for the local file DB.
    alias: process.env.NODE_ENV === 'production' ? {
          '@libsql/client/node': '@libsql/client/http',
          'drizzle-orm/libsql/node': 'drizzle-orm/libsql/http',
        } : {},
  },
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
    // The session secret is not declared here — nuxt-auth-utils owns `session.password`
    // and reads it from NUXT_SESSION_PASSWORD itself.
    smtpHost: '',        // NUXT_SMTP_HOST
    smtpPort: '465',     // NUXT_SMTP_PORT
    smtpUser: '',        // NUXT_SMTP_USER
    smtpPass: '',        // NUXT_SMTP_PASS
    mailTo: '', // NUXT_MAIL_TO
  },
})
