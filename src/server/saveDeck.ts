import { createServerFn } from '@tanstack/react-start'
import type { Deck } from '../types/deck'
import { upsertDeck } from './decksDb'
import { auth } from './auth'

export const saveDeck = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: Deck) => data)
  .handler(async ({ data, context }) => {
    upsertDeck(data, context.authUser)
    return { ok: true }
  })
