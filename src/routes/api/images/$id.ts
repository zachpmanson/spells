import { createFileRoute } from '@tanstack/react-router'
import { readStoredImage } from '../../../server/imageStorage'

export const Route = createFileRoute('/api/images/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const image = await readStoredImage(params.id)
        if (!image) {
          return new Response('Not found', { status: 404 })
        }
        return new Response(new Uint8Array(image.buffer), {
          headers: {
            'Content-Type': image.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
