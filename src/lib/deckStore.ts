import { create } from 'zustand'
import type { Deck } from '../types/deck'
import { createBlankDeck } from '../types/deck'
import type { SavedCard } from '../server/cardsDb'
import { loadDeckLibrary, saveDeckLibrary } from './persistence'
import { saveDeck } from '../server/saveDeck'
import { addCardToDeck as addCardToDeckServerFn } from '../server/addCardToDeck'
import { renameDeck as renameDeckServerFn } from '../server/renameDeck'
import { listDeckCardPreviews } from '../server/listDeckCardPreviews'

interface DeckStoreState {
  deckLibrary: Deck[]
  // Kept in the store (rather than component state) so it survives Gallery
  // unmounting/remounting on navigation — without this, returning to the
  // library after viewing a deck would briefly render empty fan previews,
  // missing the view-transition snapshot they need to morph from.
  deckPreviews: Record<string, SavedCard[]>
  hydrateDecksFromStorage: () => void
  loadDeckPreviews: (deckPublicIds: string[]) => Promise<void>
  createDeck: (title: string) => Promise<Deck | null>
  addCardToDeck: (deckEditId: string, cardPublicId: string) => Promise<void>
  renameDeck: (editId: string, title: string) => Promise<void>
  deleteDeckFromLibrary: (id: string) => void
}

export const useDeckStore = create<DeckStoreState>((set, get) => ({
  deckLibrary: [],
  deckPreviews: {},

  hydrateDecksFromStorage: () => {
    set({ deckLibrary: loadDeckLibrary() })
  },

  loadDeckPreviews: async (deckPublicIds) => {
    const previews = await listDeckCardPreviews({ data: { deckPublicIds } })
    set({ deckPreviews: { ...get().deckPreviews, ...previews } })
  },

  createDeck: async (title) => {
    const deck = createBlankDeck(title)
    const nextLibrary = [...get().deckLibrary, deck]
    if (!saveDeckLibrary(nextLibrary)) {
      window.alert('Could not save the new deck: browser storage is full.')
      return null
    }
    set({ deckLibrary: nextLibrary })
    // Awaited so callers can rely on the deck existing server-side immediately
    // afterwards (e.g. adding a card to it in the same action).
    await saveDeck({ data: deck })
    return deck
  },

  addCardToDeck: async (deckEditId, cardPublicId) => {
    await addCardToDeckServerFn({ data: { editId: deckEditId, cardPublicId } })
  },

  renameDeck: async (editId, title) => {
    await renameDeckServerFn({ data: { editId, title } })
    const nextLibrary = get().deckLibrary.map((d) => (d.editId === editId ? { ...d, title } : d))
    saveDeckLibrary(nextLibrary)
    set({ deckLibrary: nextLibrary })
  },

  deleteDeckFromLibrary: (id) => {
    const nextLibrary = get().deckLibrary.filter((d) => d.id !== id)
    if (!saveDeckLibrary(nextLibrary)) {
      window.alert('Could not update your deck library: browser storage is full.')
      return
    }
    set({ deckLibrary: nextLibrary })
  },
}))
