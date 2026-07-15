import { createServerFn } from '@tanstack/react-start'
import { listSavedCards } from './cardsDb'

export const listCards = createServerFn({ method: 'GET' }).handler(async () => {
  return listSavedCards()
})
