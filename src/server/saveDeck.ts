import { createServerFn } from '@tanstack/react-start'
import type { Deck } from '../types/deck'
import { upsertDeck } from './decksDb'

export const saveDeck = createServerFn({ method: 'POST' })
  .validator((data: Deck) => data)
  .handler(async ({ data }) => {
    upsertDeck(data)
    return { ok: true }
  })
