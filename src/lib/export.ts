import { toPng } from 'html-to-image'
import { uploadImage } from '../server/uploadImage'

export async function exportCardCanvasAsPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 750 / node.offsetWidth })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${filename || 'card'}.png`
  a.click()
}

// Standard OpenGraph embed canvas (1.91:1 landscape). Most scrapers crop or
// zoom whatever image they get into this box, so we compose the card onto it
// ourselves — whole card visible, letterboxed on the sides, nothing cut off.
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Renders the card canvas (already mounted in the DOM) to a PNG and uploads it
// to the server's image store, returning the served path used as the
// OpenGraph/twitter preview image. The card is drawn centered onto a standard
// 1200x630 OG canvas at 2x for crispness. Returns null if rendering/upload
// fails, so callers can gracefully save the card without a preview.
export async function generateCardOgImage(node: HTMLElement): Promise<string | null> {
  try {
    await document.fonts.ready
    const card = await loadImage(await toPng(node, { pixelRatio: 2 }))

    const canvas = document.createElement('canvas')
    canvas.width = OG_IMAGE_WIDTH
    canvas.height = OG_IMAGE_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT)

    // Fit the (portrait) card by height so the whole card is visible, centered
    // horizontally with padding on either side.
    const drawHeight = OG_IMAGE_HEIGHT
    const drawWidth = drawHeight * (card.width / card.height)
    const x = (OG_IMAGE_WIDTH - drawWidth) / 2
    ctx.drawImage(card, x, 0, drawWidth, drawHeight)

    const { url } = await uploadImage({ data: { dataUrl: canvas.toDataURL('image/png') } })
    return url
  } catch (err) {
    console.error('Failed to generate card preview image:', err)
    return null
  }
}

// Renders a deck cover node (a hidden 1200x630 "deck-og-cover" element with the
// deck title + a fan of card previews) to a PNG and uploads it, returning the
// served path used as the OpenGraph/twitter preview for /deck/<uuid> links.
// Returns null on failure so callers can fall back gracefully (no og meta).
export async function generateDeckOgImage(node: HTMLElement): Promise<string | null> {
  try {
    await document.fonts.ready
    const image = await loadImage(await toPng(node, { pixelRatio: 2 }))

    const canvas = document.createElement('canvas')
    canvas.width = OG_IMAGE_WIDTH
    canvas.height = OG_IMAGE_HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(image, 0, 0, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT)
    const { url } = await uploadImage({ data: { dataUrl: canvas.toDataURL('image/png') } })
    return url
  } catch (err) {
    console.error('Failed to generate deck preview image:', err)
    return null
  }
}
