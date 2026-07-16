import { createServerFn } from '@tanstack/react-start'
import { getDeckByEditId, removeCardFromDeck as removeCardFromDeckRow } from './decksDb'

export const removeCardFromDeck = createServerFn({ method: 'POST' })
  .validator((data: { editId: string; cardPublicId: string }) => data)
  .handler(async ({ data }) => {
    const deck = getDeckByEditId(data.editId)
    if (!deck) throw new Error('Deck not found')
    removeCardFromDeckRow(deck.publicId, data.cardPublicId)
    return { ok: true }
  })
