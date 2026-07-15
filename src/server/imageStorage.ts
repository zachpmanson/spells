import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getDataDir } from './dataDir'

const STORAGE_DIR = path.join(getDataDir(), 'images')

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const EXT_TO_CONTENT_TYPE: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function saveImageDataUrl(dataUrl: string): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) {
    throw new Error('Expected a base64 data URL')
  }
  const [, contentType, base64] = match
  const ext = CONTENT_TYPE_TO_EXT[contentType] ?? 'png'
  const id = `${randomUUID()}.${ext}`

  await mkdir(STORAGE_DIR, { recursive: true })
  await writeFile(path.join(STORAGE_DIR, id), Buffer.from(base64, 'base64'))

  return `/api/images/${id}`
}

export async function readStoredImage(id: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const safeId = path.basename(id)
  const filePath = path.join(STORAGE_DIR, safeId)
  try {
    const buffer = await readFile(filePath)
    const ext = path.extname(safeId).slice(1).toLowerCase()
    return { buffer, contentType: EXT_TO_CONTENT_TYPE[ext] ?? 'application/octet-stream' }
  } catch {
    return null
  }
}
