import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { MultiPartData } from 'h3'
import { useDb } from '~~/server/db'
import { photos, guideItems, siteTexts } from '~~/server/db/schema'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

/** Validates an uploaded image part and saves it to public/uploads. Returns the public URL. */
export function saveUploadedImage(filePart: MultiPartData | undefined): string {
  if (!filePart || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'Chybí soubor s obrázkem.' })
  }

  const ext = extname(filePart.filename).toLowerCase()
  const mime = (filePart.type ?? '').toLowerCase()
  if (!ALLOWED_EXT.includes(ext) || !filePart.type || !ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Neplatný typ souboru. Povolené: JPG, PNG, WebP.' })
  }

  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  mkdirSync(uploadsDir, { recursive: true })
  const filename = `${randomUUID()}${ext}`
  writeFileSync(join(uploadsDir, filename), filePart.data)
  return `/uploads/${filename}`
}

export function uploadsDirPath(): string {
  return join(process.cwd(), 'public', 'uploads')
}

/**
 * Files in public/uploads referenced by neither photos nor guide items (nor any
 * site text value, just in case a URL was pasted there). `placeholder-*` files
 * are always kept — they're hard-coded fallbacks.
 */
export function listOrphanUploads(): string[] {
  let files: string[]
  try {
    files = readdirSync(uploadsDirPath())
  } catch {
    return []
  }

  const db = useDb()
  const referenced = new Set<string>()
  for (const row of db.select({ url: photos.url }).from(photos).all()) {
    referenced.add(row.url)
  }
  for (const row of db.select({ imageUrl: guideItems.imageUrl }).from(guideItems).all()) {
    if (row.imageUrl) referenced.add(row.imageUrl)
  }
  const textBlob = db
    .select({ valueCs: siteTexts.valueCs, valueEn: siteTexts.valueEn })
    .from(siteTexts)
    .all()
    .map((r) => `${r.valueCs}\n${r.valueEn}`)
    .join('\n')

  return files.filter(
    (f) => !f.startsWith('placeholder-') && !referenced.has(`/uploads/${f}`) && !textBlob.includes(f),
  )
}
