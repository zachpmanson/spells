import { createServerFn } from '@tanstack/react-start'
import { getSavedCardByEditId } from './cardsDb'
import { auth } from './auth'

// Edit access to a card is owner-gated when the card is claimed by an
// account. An unowned (NULL-owner) card stays editable by its editId bearer
// (the anonymous/local flow). Once owned, only the owner may fetch it for
// editing — so sharing the publicId link (stripped of editId) can't walk into
// the edit surface.
// POST so the edge can gate it behind auth: loading a card FOR editing reads
// owner/private editing data, so it belongs to the protected surface (Caddy
// basicauth on POST /_serverFn/*, which stamps X-Auth-User). Kept as a separate
// POST from saveCard so the loader stays read-only in purpose.
export const getCardForEdit = createServerFn({ method: 'POST', middleware: [auth] })
  .validator((data: { editId: string }) => data)
  .handler(async ({ data, context }) => {
    const card = getSavedCardByEditId(data.editId)
    if (!card) return null
    if (card.owner && card.owner !== context.authUser) {
      throw new Error('Not authorized to edit this card')
    }
    return card
  })
