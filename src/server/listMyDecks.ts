import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'
import { listOwnedDecks } from './decksDb'

// Lightweight signed-in deck chooser for the "add to deck" dropdown. Returns
// ONLY the owned decks (no cover previews / card payloads), so a card page can
// populate the deck list without shipping the whole library.
export const listMyDecks = createServerFn({ method: 'GET', middleware: [auth] }).handler(
  async ({ context }) => {
    const owner = context.authUser
    if (!owner) throw new Error('Unauthorized')
    return { decks: listOwnedDecks(owner) }
  },
)