import { createServerFn } from '@tanstack/react-start'
import type { Card } from '../types/card'
import { createBlankDeck } from '../types/deck'
import { addCardToDeck, getDeckByPublicId, listCardsInDeck, upsertDeck } from './decksDb'
import { upsertSavedCard } from './cardsDb'

// Forks an existing deck: duplicates the deck row and every card in it with
// fresh identities (new id/publicId/editId), so the fork is independently
// owned and editable by whoever forks it. Returns the new deck and cards so
// the client can adopt them into the local browser library.
export const forkDeck = createServerFn({ method: 'POST' })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data }) => {
    const source = getDeckByPublicId(data.publicId)
    if (!source) throw new Error('Deck not found')

    const deck = createBlankDeck(source.title)
    upsertDeck(deck)

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
    }))
    for (const card of cards) {
      upsertSavedCard(card)
      addCardToDeck(deck.publicId, card.publicId)
    }
    return { deck, cards }
  })
