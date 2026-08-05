export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  // Recomputed server-side — the client never chooses which files get deleted.
  const orphans = await listOrphanUploads()
  for (const url of orphans) {
    // Never throws — one missing file must not 500 the whole sweep.
    await deleteUploadedImage(url)
  }
  return { deleted: orphans }
})
