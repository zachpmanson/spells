import { createServerFn } from '@tanstack/react-start'
import { listSavedCardIds } from './cardsDb'

export const getSavedCardIds = createServerFn({ method: 'GET' }).handler(async () => {
  return listSavedCardIds()
})
