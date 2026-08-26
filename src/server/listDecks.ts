import { createServerFn } from '@tanstack/react-start'
import { listSavedDecks, listCardPreviewsForDecks } from './decksDb'
import { auth } from './auth'

// Admin-only read (backs /admin/decks). Requires a signed-in request — closes
// the data path so the full deck listing + previews can't be enumerated via the
// GET server fn directly; only the admin page calls this.
export const listDecks = createServerFn({ method: 'GET', middleware: [auth] })
  .validator((data: { page?: number }) => data)
  .handler(async ({ data, context }) => {
    if (!context.authUser) throw new Error('Unauthorized')
    const { decks, total } = listSavedDecks(data.page ?? 0)
    const previews = listCardPreviewsForDecks(decks.map((deck) => deck.publicId))
    return { decks, total, previews }
  })
