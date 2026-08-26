import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import * as cardsDb from './cardsDb'

// Deletes a card from the server, owner-gated (only the card's claimed owner
// may delete it). Called from the signed-in library delete action.
export const deleteCard = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data, context }) => {
    cardsDb.deleteCard(data.publicId, context.authUser)
    return { ok: true }
  })