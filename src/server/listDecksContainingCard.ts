import { createServerFn } from '@tanstack/react-start'
import { listDeckPublicIdsContainingCard } from './decksDb'

export const listDecksContainingCard = createServerFn({ method: 'POST' })
  .validator((data: { cardPublicId: string; deckPublicIds: string[] }) => data)
  .handler(async ({ data }) => {
    return listDeckPublicIdsContainingCard(data.cardPublicId, data.deckPublicIds)
  })
