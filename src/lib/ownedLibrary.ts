import { create } from 'zustand'
import type { SavedCard } from '../server/cardsDb'
import type { SavedDeck } from '../server/decksDb'
import { getMyLibrary } from '../server/getMyLibrary'
import { whoami } from '../server/whoami'

// Signed-in "my library" state, kept in a store rather than component state so
// it survives Gallery unmounting/remounting on navigation. Without this, the
// index route re-ran whoami()+getMyLibrary() on every mount, resetting cards/decks
// to null and flashing the "Loading your decks…/cards…" state each time you return
// to the library (e.g. library -> deck -> library). Same pattern as deckPreviews.
interface OwnedLibraryState {
  authed: boolean
  cards: SavedCard[] | null
  decks: SavedDeck[] | null
  previews: Record<string, SavedCard[]>
  // True once an identity/library fetch has resolved this session. Kept in the
  // store so re-mounts don't drop back into the null ("Loading…") state.
  loaded: boolean
  load: () => Promise<void>
  removeCard: (id: string) => void
  removeDeck: (id: string) => void
}

export const useOwnedLibrary = create<OwnedLibraryState>((set, get) => ({
  authed: false,
  cards: null,
  decks: null,
  previews: {},
  loaded: false,

  load: async () => {
    if (get().loaded) return
    // Guard against concurrent remounts while a fetch is already in flight.
    try {
      const { user } = await whoami()
      if (!user) {
        set({ authed: false, loaded: true })
        return
      }
      const lib = await getMyLibrary()
      set({ authed: true, cards: lib.cards, decks: lib.decks, previews: lib.previews, loaded: true })
    } catch (err) {
      console.error('Failed to resolve library:', err)
      set({ loaded: true })
    }
  },

  removeCard: (id) => {
    const cards = get().cards
    set({ cards: cards ? cards.filter((c) => c.id !== id) : null })
  },

  removeDeck: (id) => {
    const decks = get().decks
    set({ decks: decks ? decks.filter((d) => d.id !== id) : null })
  },
}))