import { lt } from 'drizzle-orm'
import { useDb } from '~~/server/db'
import { pageViews } from '~~/server/db/schema'

const RETENTION_DAYS = 90

// Writes a page view. Deliberately GET — the demo session may only GET (server/middleware/demo-readonly.ts).
// Unauthenticated by design (it tracks anonymous visitors), so it is rate limited and the
// table is pruned — otherwise anyone could loop it and fill the database.
export default defineEventHandler(async (event) => {
  // 60 views per IP per minute — far above real browsing, well below a script loop.
  if (!allow(event, 'track', 60, 60 * 1000)) return { ok: false }

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

  await useDb().insert(pageViews).values({
    ts: new Date().toISOString(),
    visitor,
    path,
    referrer: String(q.ref || '').slice(0, 300),
    userName: user?.name || '',
    role: user?.role || '',
    userAgent: (getRequestHeader(event, 'user-agent') || '').slice(0, 300),
  }).run()

  // ponytail: probabilistic prune — roughly one delete per 100 views keeps the table
  // bounded without a scheduled job. Swap for a cron if the sampling ever misses.
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    await useDb().delete(pageViews).where(lt(pageViews.ts, cutoff)).run()
  }

  return { ok: true }
})
