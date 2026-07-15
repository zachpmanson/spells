import { createServerFn } from '@tanstack/react-start'
import type { Card } from '../types/card'
import { upsertSavedCard } from './cardsDb'

export const saveCard = createServerFn({ method: 'POST' })
  .validator((data: Card) => data)
  .handler(async ({ data }) => {
    upsertSavedCard(data)
    return { ok: true }
  })
