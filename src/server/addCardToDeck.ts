import { createServerFn } from '@tanstack/react-start'
import { addCardToDeck as addCardToDeckRow, getDeckByEditId } from './decksDb'

export const addCardToDeck = createServerFn({ method: 'POST' })
  .validator((data: { editId: string; cardPublicId: string }) => data)
  .handler(async ({ data }) => {
    const deck = getDeckByEditId(data.editId)
    if (!deck) throw new Error('Deck not found')
    addCardToDeckRow(deck.publicId, data.cardPublicId)
    return { ok: true }
  })
