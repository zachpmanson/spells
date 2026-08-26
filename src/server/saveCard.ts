import { createServerFn } from '@tanstack/react-start'
import type { Card } from '../types/card'
import { upsertSavedCard } from './cardsDb'
import { auth } from './auth'

export const saveCard = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: Card) => data)
  .handler(async ({ data, context }) => {
    upsertSavedCard(data, context.authUser)
    return { ok: true }
  })
