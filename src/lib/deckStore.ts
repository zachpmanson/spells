import { create } from 'zustand'
import type { Deck } from '../types/deck'
import { createBlankDeck } from '../types/deck'
import { loadDeckLibrary, saveDeckLibrary } from './persistence'
import { saveDeck } from '../server/saveDeck'
import { addCardToDeck as addCardToDeckServerFn } from '../server/addCardToDeck'
import { renameDeck as renameDeckServerFn } from '../server/renameDeck'

interface DeckStoreState {
  deckLibrary: Deck[]
  hydrateDecksFromStorage: () => void
  createDeck: (title: string) => Promise<Deck | null>
  addCardToDeck: (deckEditId: string, cardPublicId: string) => Promise<void>
  renameDeck: (editId: string, title: string) => Promise<void>
  deleteDeckFromLibrary: (id: string) => void
}

export const useDeckStore = create<DeckStoreState>((set, get) => ({
  deckLibrary: [],

  hydrateDecksFromStorage: () => {
    set({ deckLibrary: loadDeckLibrary() })
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
