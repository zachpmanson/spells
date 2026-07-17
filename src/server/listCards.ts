import { createServerFn } from '@tanstack/react-start'
import { listSavedCards } from './cardsDb'

export const listCards = createServerFn({ method: 'GET' })
  .validator((data: { page?: number }) => data)
  .handler(async ({ data }) => {
    return listSavedCards(data.page ?? 0)
  })
