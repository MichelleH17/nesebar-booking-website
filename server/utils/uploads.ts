import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { join, extname } from 'node:path'
import type { MultiPartData } from 'h3'
import { useDb } from '~~/server/db'
import { photos, guideItems, siteTexts } from '~~/server/db/schema'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Validates an uploaded image part and stores it. Returns the public URL.
 * On Vercel (BLOB_READ_WRITE_TOKEN set) it goes to Vercel Blob and the URL is
 * absolute; locally it stays in public/uploads and the URL is `/uploads/…`.
 */
export async function saveUploadedImage(filePart: MultiPartData | undefined): Promise<string> {
  if (!filePart || !filePart.filename) {
    throw createError({ statusCode: 400, message: 'Chybí soubor s obrázkem.' })
  }

  const ext = extname(filePart.filename).toLowerCase()
  const mime = (filePart.type ?? '').toLowerCase()
  if (!ALLOWED_EXT.includes(ext) || !filePart.type || !ALLOWED_MIME.includes(mime)) {
    throw createError({ statusCode: 400, message: 'Neplatný typ souboru. Povolené: JPG, PNG, WebP.' })
  }

  const filename = `${randomUUID()}${ext}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const { url } = await put(`uploads/${filename}`, filePart.data, {
      access: 'public',
      contentType: mime,
    })
    return url
  }

  // The local-file path can't work on a serverless read-only FS — fail with the real
  // cause instead of an opaque EROFS, same as the DB guard in server/db/index.ts.
  if (process.env.VERCEL || process.env.NETLIFY) {
    throw createError({
      statusCode: 500,
      message: 'Úložiště obrázků není nastavené (chybí BLOB_READ_WRITE_TOKEN).',
    })
  }

  const uploadsDir = uploadsDirPath()
  mkdirSync(uploadsDir, { recursive: true })
  writeFileSync(join(uploadsDir, filename), filePart.data)
  return `/uploads/${filename}`
}

/** Removes a stored image by the URL saveUploadedImage returned. Never throws. */
export async function deleteUploadedImage(url: string): Promise<void> {
  try {
    if (url.startsWith('http')) {
      const { del } = await import('@vercel/blob')
      await del(url)
    } else if (url.startsWith('/uploads/')) {
      rmSync(join(uploadsDirPath(), url.slice('/uploads/'.length)), { force: true })
    }
  } catch {
    // best effort — a missing file must not fail the request
  }
}

export function uploadsDirPath(): string {
  return join(process.cwd(), 'public', 'uploads')
}

/** Every stored image URL, in the same form the DB holds. */
async function listStoredImages(): Promise<string[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { list } = await import('@vercel/blob')
    // ponytail: one page (1000 blobs). Paginate with the returned cursor if the
    // gallery ever outgrows that.
    const { blobs } = await list({ prefix: 'uploads/' })
    return blobs.map((b) => b.url)
  }
  try {
    return readdirSync(uploadsDirPath()).map((f) => `/uploads/${f}`)
  } catch {
    return []
  }
}

/**
 * Stored images referenced by neither photos nor guide items (nor any site text
 * value, just in case a URL was pasted there). Returns URLs, not bare filenames,
 * so local files and blobs are interchangeable. `placeholder-*` files are always
 * kept — they're hard-coded fallbacks.
 */
export async function listOrphanUploads(): Promise<string[]> {
  const stored = await listStoredImages()
  if (stored.length === 0) return []

  const db = useDb()
  const referenced = new Set<string>()
  for (const row of await db.select({ url: photos.url }).from(photos).all()) {
    referenced.add(row.url)
  }
  for (const row of await db.select({ imageUrl: guideItems.imageUrl }).from(guideItems).all()) {
    if (row.imageUrl) referenced.add(row.imageUrl)
  }
  const textRows = await db
    .select({ valueCs: siteTexts.valueCs, valueEn: siteTexts.valueEn })
    .from(siteTexts)
    .all()
  const textBlob = textRows.map((r) => `${r.valueCs}\n${r.valueEn}`).join('\n')

  return stored.filter((url) => {
    const filename = url.slice(url.lastIndexOf('/') + 1)
    return !filename.startsWith('placeholder-') && !referenced.has(url) && !textBlob.includes(filename)
  })
}
