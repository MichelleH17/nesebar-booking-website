// Warm Czech read-only notice shown when a demo session attempts a change.
export const DEMO_BLOCK_MESSAGE = 'Tohle je jen ukázka 🙂 změny se neukládají.'

// True when a demo session's request must be rejected: any mutating (non-GET/HEAD)
// call under /api, except auth routes — both our /api/auth/* endpoints and
// nuxt-auth-utils' internal /api/_auth/session (useUserSession().clear() DELETEs it).
// Auth routes only manage the session cookie, never domain data, so logging out stays possible.
export function shouldBlockDemoWrite(role: string, method: string, path: string): boolean {
  if (role !== 'demo') return false
  if (!path.startsWith('/api/')) return false
  if (path.startsWith('/api/auth/') || path.startsWith('/api/_auth/')) return false
  const m = method.toUpperCase()
  return m !== 'GET' && m !== 'HEAD'
}

// Detect the demo read-only 403 from a caught $fetch error. ofetch exposes the parsed
// error body as `err.data`; our middleware nests the flag under that body's own `data`
// key (the H3 error envelope), so the flag lives at err.data.data.demo.
export function isDemoBlock(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const body = (err as { data?: unknown }).data
  if (!body || typeof body !== 'object') return false
  const inner = (body as { data?: unknown }).data
  return !!inner && typeof inner === 'object' && (inner as { demo?: unknown }).demo === true
}
