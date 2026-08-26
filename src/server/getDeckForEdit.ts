import { createServerFn } from '@tanstack/react-start'
import { getDeckByEditId, listCardsInDeck, assertDeckOwnership } from './decksDb'
import { auth } from './auth'

// POST so the edge can gate it behind auth: loading a deck FOR editing reads
// owner/private editing data (deck + its card editIds), so it belongs to the
// protected surface (Caddy basicauth on POST /_serverFn/*, which stamps
// X-Auth-User). Kept separate from saveDeck so the loader stays read-only.
export const getDeckForEdit = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { editId: string }) => data)
  .handler(async ({ data, context }) => {
    const deck = getDeckByEditId(data.editId)
    assertDeckOwnership(deck, context.authUser)
    if (!deck) return null
    return { deck, cards: listCardsInDeck(deck.publicId) }
  })
