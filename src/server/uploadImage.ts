import { createServerFn } from '@tanstack/react-start'
import { saveImageDataUrl } from './imageStorage'

export const uploadImage = createServerFn({ method: 'POST' })
  .validator((data: { dataUrl: string }) => data)
  .handler(async ({ data }) => {
    return { url: await saveImageDataUrl(data.dataUrl) }
  })
