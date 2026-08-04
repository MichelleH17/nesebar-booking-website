import { useDb } from '~~/server/db'
import { pageViews } from '~~/server/db/schema'

// Zápis návštěvy. Schválně GET — demo session smí jen GET (server/middleware/demo-readonly.ts).
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const path = String(q.path || '').slice(0, 200)
  if (!path.startsWith('/')) return { ok: false }

  let visitor = getCookie(event, 'vid')
  if (!visitor) {
    visitor = crypto.randomUUID()
    setCookie(event, 'vid', visitor, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' })
  }

  const session = await getUserSession(event)
  const user = session?.user as { name?: string; role?: string } | undefined

  useDb().insert(pageViews).values({
    ts: new Date().toISOString(),
    visitor,
    path,
    referrer: String(q.ref || '').slice(0, 300),
    userName: user?.name || '',
    role: user?.role || '',
    userAgent: (getRequestHeader(event, 'user-agent') || '').slice(0, 300),
  }).run()

  return { ok: true }
})
