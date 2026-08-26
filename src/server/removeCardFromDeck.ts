import { createServerFn } from '@tanstack/react-start'
import { getDeckByEditId, removeCardFromDeck as removeCardFromDeckRow, assertDeckOwnership } from './decksDb'
import { auth } from './auth'

export const removeCardFromDeck = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { editId: string; cardPublicId: string }) => data)
  .handler(async ({ data, context }) => {
    const deck = getDeckByEditId(data.editId)
    assertDeckOwnership(deck, context.authUser)
    if (!deck) throw new Error('Deck not found')
    removeCardFromDeckRow(deck.publicId, data.cardPublicId, context.authUser)
    return { ok: true }
  })
