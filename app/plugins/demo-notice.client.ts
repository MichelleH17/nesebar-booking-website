import { isDemoBlock, DEMO_BLOCK_MESSAGE } from '~~/shared/utils/demo'

// Wraps the global $fetch so any demo read-only 403 (tagged data.demo) surfaces the
// warm notice once, app-wide — no per-call-site wiring. Re-throws so existing
// per-form error handling still runs.
export default defineNuxtPlugin(() => {
  const { show } = useDemoNotice()
  const original = globalThis.$fetch

  globalThis.$fetch = original.create({
    onResponseError({ response }) {
      const body = response?._data
      if (response?.status === 403 && isDemoBlock({ data: body })) {
        show((body as { message?: string })?.message || DEMO_BLOCK_MESSAGE)
      }
    },
  }) as typeof original
})
