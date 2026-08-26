import { createServerFn } from '@tanstack/react-start'
import { listDeckPublicIdsContainingCard } from './decksDb'

// GET: a public read (shows which shared decks contain a card), so it avoids
// the edge's auth gate on POST /_serverFn/*.
export const listDecksContainingCard = createServerFn({ method: 'GET' })
  .validator((data: { cardPublicId: string; deckPublicIds: string[] }) => data)
  .handler(async ({ data }) => {
    return listDeckPublicIdsContainingCard(data.cardPublicId, data.deckPublicIds)
  })
