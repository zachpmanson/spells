import { createServerFn } from '@tanstack/react-start'
import { getDeckByPublicId, listCardsInDeck, redactDeckEditId } from './decksDb'

export const getDeck = createServerFn({ method: 'GET' })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data }) => {
    const deck = getDeckByPublicId(data.publicId)
    if (!deck) return null
    return { deck: redactDeckEditId(deck), cards: listCardsInDeck(deck.publicId) }
  })
