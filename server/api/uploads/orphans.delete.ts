import { rmSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  // Recomputed server-side — the client never chooses which files get deleted.
  const orphans = listOrphanUploads()
  const dir = uploadsDirPath()
  for (const file of orphans) {
    rmSync(join(dir, file), { force: true })
  }
  return { deleted: orphans }
})
