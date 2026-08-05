export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, message: 'Chybí data formuláře.' })
  }

  // Saves to public/uploads without creating a gallery (photos) row.
  const url = await saveUploadedImage(parts.find((p) => p.name === 'file'))
  return { url }
})
