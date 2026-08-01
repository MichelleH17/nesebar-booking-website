import { useDb } from '~~/server/db'
import { photos } from '~~/server/db/schema'

const VALID_APARTMENTS = ['15B', '16B']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, message: 'Chybí data formuláře.' })
  }

  const filePart = parts.find((p) => p.name === 'file')
  const altPart = parts.find((p) => p.name === 'alt')
  const altEnPart = parts.find((p) => p.name === 'altEn')
  const apartmentIdPart = parts.find((p) => p.name === 'apartmentId')
  const sortOrderPart = parts.find((p) => p.name === 'sortOrder')

  const alt = altPart?.data.toString('utf-8').trim()
  if (!alt) {
    throw createError({ statusCode: 400, message: 'Chybí popisek fotky.' })
  }
  const altEn = altEnPart?.data.toString('utf-8').trim() ?? ''

  let apartmentId: string | null = null
  if (apartmentIdPart) {
    const val = apartmentIdPart.data.toString('utf-8').trim()
    if (val) {
      if (!VALID_APARTMENTS.includes(val)) {
        throw createError({ statusCode: 400, message: 'Neplatný byt.' })
      }
      apartmentId = val
    }
  }

  let sortOrder = 0
  if (sortOrderPart) {
    const val = sortOrderPart.data.toString('utf-8').trim()
    if (val) {
      const n = Number(val)
      if (!Number.isInteger(n)) {
        throw createError({ statusCode: 400, message: 'Neplatné pořadí.' })
      }
      sortOrder = n
    }
  }

  // Validation above runs first so no file is written for an invalid request.
  const url = saveUploadedImage(filePart)

  const db = useDb()
  const row = db
    .insert(photos)
    .values({ apartmentId, url, alt, altEn, sortOrder })
    .returning()
    .get()

  return row
})
