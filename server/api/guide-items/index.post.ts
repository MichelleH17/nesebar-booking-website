import { useDb } from '~~/server/db'
import { guideItems } from '~~/server/db/schema'

const VALID_TYPES = ['beach', 'trip', 'info']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  if (typeof body.type !== 'string' || !VALID_TYPES.includes(body.type)) {
    throw createError({ statusCode: 400, message: 'Neplatný typ položky.' })
  }
  if (typeof body.title !== 'string' || !body.title.trim()) {
    throw createError({ statusCode: 400, message: 'Chybí název.' })
  }
  if (typeof body.description !== 'string' || !body.description.trim()) {
    throw createError({ statusCode: 400, message: 'Chybí popis.' })
  }
  if (body.titleEn !== undefined && typeof body.titleEn !== 'string') {
    throw createError({ statusCode: 400, message: 'Neplatný anglický název.' })
  }
  if (body.descriptionEn !== undefined && typeof body.descriptionEn !== 'string') {
    throw createError({ statusCode: 400, message: 'Neplatný anglický popis.' })
  }
  if (body.imageUrl !== undefined && body.imageUrl !== null && typeof body.imageUrl !== 'string') {
    throw createError({ statusCode: 400, message: 'Neplatná URL obrázku.' })
  }
  if (body.meta !== undefined && body.meta !== null && typeof body.meta !== 'string') {
    throw createError({ statusCode: 400, message: 'Neplatné meta pole.' })
  }
  if (body.metaEn !== undefined && body.metaEn !== null && typeof body.metaEn !== 'string') {
    throw createError({ statusCode: 400, message: 'Neplatné anglické meta pole.' })
  }
  let sortOrder = 0
  if (body.sortOrder !== undefined) {
    if (!Number.isInteger(body.sortOrder)) {
      throw createError({ statusCode: 400, message: 'Neplatné pořadí.' })
    }
    sortOrder = body.sortOrder
  }

  const db = useDb()
  return await db
    .insert(guideItems)
    .values({
      type: body.type,
      title: body.title.trim(),
      titleEn: typeof body.titleEn === 'string' ? body.titleEn.trim() : '',
      description: body.description.trim(),
      descriptionEn: typeof body.descriptionEn === 'string' ? body.descriptionEn.trim() : '',
      imageUrl: body.imageUrl ?? null,
      meta: body.meta ?? null,
      metaEn: body.metaEn ?? null,
      sortOrder,
    })
    .returning()
    .get()
})
