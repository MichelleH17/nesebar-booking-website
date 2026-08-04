// Traffic: pings /api/track on first load and on every SPA navigation.
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const send = (path: string, ref: string) => {
    $fetch('/api/track', { query: { path, ref } }).catch(() => {})
  }

  nuxtApp.hook('app:mounted', () => {
    send(router.currentRoute.value.fullPath, document.referrer)
  })
  router.afterEach((to, from) => {
    if (to.fullPath !== from.fullPath) send(to.fullPath, '')
  })
})
