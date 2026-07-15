import { toPng } from 'html-to-image'

export async function exportCardCanvasAsPng(node: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 750 / node.offsetWidth })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${filename || 'card'}.png`
  a.click()
}
