import { createServerFn } from '@tanstack/react-start'
import { getSavedCard, redactEditId } from './cardsDb'

export const getCard = createServerFn({ method: 'GET' })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data }) => {
    const card = getSavedCard(data.publicId)
    return card ? redactEditId(card) : null
  })
