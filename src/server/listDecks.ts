import { createServerFn } from '@tanstack/react-start'
import { listSavedDecks } from './decksDb'

export const listDecks = createServerFn({ method: 'GET' }).handler(async () => {
  return listSavedDecks()
})
