import { useDb } from '~~/server/db'
import { apartments } from '~~/server/db/schema'
import { shapeApartments } from '~~/shared/utils/visibility'

// Public endpoint (the landing page needs it before login), so the response is shaped
// by role — see shapeApartments for the rules.
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const role = (session?.user as { role?: string } | undefined)?.role

  const rows = await useDb().select().from(apartments).all()
  return shapeApartments(rows, role)
})
