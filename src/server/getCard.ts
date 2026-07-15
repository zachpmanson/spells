import { createServerFn } from '@tanstack/react-start'
import { getSavedCard } from './cardsDb'

export const getCard = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    return getSavedCard(data.id)
  })
