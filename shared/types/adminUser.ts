// GET /api/users (admin only) — passwordHash is always stripped server-side.
// Named AdminUser to avoid clashing with the #auth-utils session User type (auth.d.ts).
export interface AdminUser {
  id: number
  name: string
  email: string
  role: 'guest' | 'family' | 'admin'
  color: string
  createdAt: string
}
