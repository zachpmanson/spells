import { createServerFn } from '@tanstack/react-start'
import { getSavedCard } from './cardsDb'

export const getCard = createServerFn({ method: 'GET' })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data }) => {
    return getSavedCard(data.publicId)
  })
