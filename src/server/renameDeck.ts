import { createServerFn } from '@tanstack/react-start'
import { getDeckByEditId, renameDeck as renameDeckRow, assertDeckOwnership } from './decksDb'
import { auth } from './auth'

export const renameDeck = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { editId: string; title: string }) => data)
  .handler(async ({ data, context }) => {
    const deck = getDeckByEditId(data.editId)
    assertDeckOwnership(deck, context.authUser)
    if (!deck) throw new Error('Deck not found')
    renameDeckRow(data.editId, data.title, context.authUser)
    return { ok: true }
  })
