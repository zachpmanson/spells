import { createServerFn } from '@tanstack/react-start'
import { getDeckByEditId, listCardsInDeck } from './decksDb'

export const getDeckForEdit = createServerFn({ method: 'GET' })
  .validator((data: { editId: string }) => data)
  .handler(async ({ data }) => {
    const deck = getDeckByEditId(data.editId)
    if (!deck) return null
    return { deck, cards: listCardsInDeck(deck.publicId) }
  })
