import { createServerFn } from '@tanstack/react-start'
import { listSavedDecks, listCardPreviewsForDecks } from './decksDb'

export const listDecks = createServerFn({ method: 'GET' })
  .validator((data: { page?: number }) => data)
  .handler(async ({ data }) => {
    const { decks, total } = listSavedDecks(data.page ?? 0)
    const previews = listCardPreviewsForDecks(decks.map((deck) => deck.publicId))
    return { decks, total, previews }
  })
