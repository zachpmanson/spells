import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import * as decksDb from './decksDb'

// Deletes a deck from the server, owner-gated (only the deck's claimed owner
// may delete it). Also drops its deck_cards memberships. Called from the
// signed-in library delete action.
export const deleteDeck = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data, context }) => {
    decksDb.deleteDeck(data.publicId, context.authUser)
    return { ok: true }
  })