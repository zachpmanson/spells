import { createServerFn } from '@tanstack/react-start'
import { getSavedCard, redactEditId } from './cardsDb'
import { auth } from './auth'

// Public card view. Share links must not leak edit access, so the editId is
// redacted for everyone EXCEPT the card's own owner (compared against the
// edge-authenticated identity, null for anonymous). Returning the real editId
// to the owner means the view can offer an Edit button on any device — not
// just ones that happen to have the card cached in localStorage.
export const getCard = createServerFn({ method: 'GET', middleware: [auth] })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data, context }) => {
    const card = getSavedCard(data.publicId)
    if (!card) return null
    return card.owner === context.authUser ? card : redactEditId(card)
  })
