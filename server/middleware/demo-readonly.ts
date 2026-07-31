import { shouldBlockDemoWrite, DEMO_BLOCK_MESSAGE } from '~~/shared/utils/demo'

// The hard security boundary for the demo role: rejects every mutating /api call
// from a demo session. No individual handler can be forgotten because all mutations
// are non-GET /api requests. Runs on every request; only acts when a demo session exists.
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/')) return

  const session = await getUserSession(event)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!role) return

  if (shouldBlockDemoWrite(role, event.method, path)) {
    throw createError({
      statusCode: 403,
      statusMessage: DEMO_BLOCK_MESSAGE,
      message: DEMO_BLOCK_MESSAGE,
      data: { demo: true },
    })
  }
})
