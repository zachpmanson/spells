import { toPng } from 'html-to-image'
import { uploadImage } from '../server/uploadImage'

export async function exportCardCanvasAsPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 750 / node.offsetWidth })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${filename || 'card'}.png`
  a.click()
}

// Renders the card canvas (already mounted in the DOM) to a PNG and uploads it
// to the server's image store, returning the served path used as the
// OpenGraph/twitter preview image. Returns null if rendering/upload fails, so
// callers can gracefully save the card without a preview.
export async function generateCardOgImage(node: HTMLElement): Promise<string | null> {
  try {
    await document.fonts.ready
    const dataUrl = await toPng(node, { pixelRatio: 750 / node.offsetWidth })
    const { url } = await uploadImage({ data: { dataUrl } })
    return url
  } catch (err) {
    console.error('Failed to generate card preview image:', err)
    return null
  }
}
