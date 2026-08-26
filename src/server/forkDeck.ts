import { createServerFn } from '@tanstack/react-start'
import type { Card } from '../types/card'
import { createBlankDeck } from '../types/deck'
import { addCardToDeck, getDeckByPublicId, listCardsInDeck, upsertDeck } from './decksDb'
import { upsertSavedCard } from './cardsDb'
import { auth } from './auth'

// Forks an existing deck: duplicates the deck row and every card in it with
// fresh identities (new id/publicId/editId), so the fork is independently
// owned and editable by whoever forks it. Returns the new deck and cards so
// the client can adopt them into the local browser library. The fork's rows
// are claimed by the forking identity — anonymous requests still fork (and
// leave the copies unowned, editable by editId bearer) so the shared-link
// flow keeps working before auth is enforced.
export const forkDeck = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data, context }) => {
    const source = getDeckByPublicId(data.publicId)
    if (!source) throw new Error('Deck not found')

    const owner = context.authUser
    const deck = createBlankDeck(source.title)
    upsertDeck(deck, owner)

    const cards: Card[] = listCardsInDeck(source.publicId).map((card) => ({
      id: crypto.randomUUID(),
      publicId: crypto.randomUUID(),
      editId: crypto.randomUUID(),
      templateId: card.templateId,
      title: card.title,
      manaCost: card.manaCost,
      typeLine: card.typeLine,
      rulesText: card.rulesText,
      flavorText: card.flavorText,
      showFlavorText: card.showFlavorText,
      powerToughness: card.powerToughness,
      coverImage: card.coverImage,
      skillBody: card.skillBody,
    }))
    for (const card of cards) {
      upsertSavedCard(card, owner)
      addCardToDeck(deck.publicId, card.publicId, owner)
    }
    return { deck, cards }
  })
