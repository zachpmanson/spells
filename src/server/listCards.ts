import { createServerFn } from '@tanstack/react-start'
import { listSavedCards } from './cardsDb'
import { auth } from './auth'

// Admin-only read (backs /admin/cards). Requires a signed-in request — the
// edge (Caddy) gates the /admin/* page, and this auth gate closes the data
// path so someone can't hit the GET server fn directly to enumerate the whole
// library. Only the admin page calls this.
export const listCards = createServerFn({ method: 'GET', middleware: [auth] })
  .validator((data: { page?: number }) => data)
  .handler(async ({ data, context }) => {
    if (!context.authUser) throw new Error('Unauthorized')
    return listSavedCards(data.page ?? 0)
  })
