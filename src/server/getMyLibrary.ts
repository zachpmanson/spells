import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import { listOwnedCards } from './cardsDb'
import { listOwnedDecks, listCardPreviewsForDecks } from './decksDb'

// Backs the signed-in index ("my library"): returns the cards and decks owned
// by the caller plus deck cover previews. Requires a signed-in request (the
// caller identity is the X-Auth-User the edge stamped). Anonymous visitors get
// the localStorage-driven view and don't call this.
export const getMyLibrary = createServerFn({ method: 'GET', middleware: [auth] }).handler(
  async ({ context }) => {
    const owner = context.authUser
    if (!owner) throw new Error('Unauthorized')
    const cards = listOwnedCards(owner)
    const decks = listOwnedDecks(owner)
    const previews = listCardPreviewsForDecks(decks.map((d) => d.publicId))
    return { cards, decks, previews }
  },
)