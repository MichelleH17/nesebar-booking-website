import type { H3Event } from 'h3'

export type SessionUser = { id: number; name: string; role: 'guest' | 'family' | 'admin' | 'demo'; color: string }

export async function requireAuth(event: H3Event) {
  const { user } = await requireUserSession(event) // 401 if no session
  return user as SessionUser
}

// Family-level READ access. Guests are excluded; demo is allowed (read-only is enforced
// globally by server/middleware/demo-readonly.ts).
export async function requireFamily(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role === 'guest') throw createError({ statusCode: 403, message: 'Jen pro rodinu.' })
  return user
}

// Admin-level READ access. Only admin and demo may load admin screens/reads; demo cannot
// mutate (blocked globally by the demo-readonly middleware).
export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'admin' && user.role !== 'demo') throw createError({ statusCode: 403, message: 'Jen pro správce.' })
  return user
}
