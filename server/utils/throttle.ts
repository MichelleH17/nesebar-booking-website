import type { H3Event } from 'h3'

type Window = { count: number; reset: number }

// ponytail: in-memory, per-instance — counters reset on cold start and are not shared
// between serverless instances, so a determined attacker gets `limit` tries per instance
// per window. Enough friction for a family site; move to a Turso table or KV counter if
// real abuse shows up in the traffic panel.
const windows = new Map<string, Window>()

/**
 * Fixed-window rate limit keyed by caller IP. Returns false when the caller is over
 * budget; callers decide whether that means a 429 or a silent no-op.
 */
export function allow(event: H3Event, key: string, limit: number, windowMs: number): boolean {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const id = `${key}:${ip}`
  const now = Date.now()

  // Drop expired entries before the map can grow without bound.
  if (windows.size > 5000) {
    for (const [k, w] of windows) {
      if (now > w.reset) windows.delete(k)
    }
  }

  const current = windows.get(id)
  if (!current || now > current.reset) {
    windows.set(id, { count: 1, reset: now + windowMs })
    return true
  }

  current.count++
  return current.count <= limit
}
