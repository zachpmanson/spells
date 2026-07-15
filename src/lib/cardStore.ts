import { create } from 'zustand'
import type { Card, CoverImage } from '../types/card'
import { createBlankCard } from '../types/card'
import { DEFAULT_TEMPLATE } from '../templates/templates'
import { loadCurrentCard, loadLibrary, saveCurrentCard, saveLibrary } from './persistence'
import { saveCard } from '../server/saveCard'

const HISTORY_LIMIT = 50

interface CardStoreState {
  card: Card
  library: Card[]
  past: Card[]
  future: Card[]
  updateField: (field: 'title' | 'manaCost' | 'typeLine' | 'rulesText' | 'flavorText' | 'powerToughness', value: string) => void
  setTemplate: (templateId: string) => void
  setCoverImage: (coverImage: CoverImage | null) => void
  setShowFlavorText: (show: boolean) => void
  undo: () => void
  redo: () => void
  newCard: () => void
  newCardWithOverrides: (overrides: Partial<Card>) => void
  loadCard: (card: Card) => void
  loadCardById: (id: string) => boolean
  saveToLibrary: () => boolean
  deleteFromLibrary: (id: string) => void
  importCards: (cards: Card[]) => void
  hydrateFromStorage: () => void
}

function persist(card: Card) {
  if (!saveCurrentCard(card)) {
    window.alert('Could not save your changes: browser storage is full. Try removing some cards from your library.')
  }
}

function pickDefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) result[key] = obj[key]
  }
  return result
}

export const useCardStore = create<CardStoreState>((set, get) => ({
  card: createBlankCard(DEFAULT_TEMPLATE.id),
  library: [],
  past: [],
  future: [],

  hydrateFromStorage: () => {
    const storedCard = loadCurrentCard()
    const library = loadLibrary()
    set({ card: storedCard ?? get().card, library })
  },

  updateField: (field, value) => {
    const { card, past } = get()
    const nextPast = [...past, card].slice(-HISTORY_LIMIT)
    const nextCard = { ...card, [field]: value }
    persist(nextCard)
    set({ card: nextCard, past: nextPast, future: [] })
  },

  setTemplate: (templateId) => {
    const { card, past } = get()
    const nextPast = [...past, card].slice(-HISTORY_LIMIT)
    const nextCard = { ...card, templateId }
    persist(nextCard)
    set({ card: nextCard, past: nextPast, future: [] })
  },

  setCoverImage: (coverImage) => {
    const { card, past } = get()
    const nextPast = [...past, card].slice(-HISTORY_LIMIT)
    const nextCard = { ...card, coverImage }
    persist(nextCard)
    set({ card: nextCard, past: nextPast, future: [] })
  },

  setShowFlavorText: (showFlavorText) => {
    const { card, past } = get()
    const nextPast = [...past, card].slice(-HISTORY_LIMIT)
    const nextCard = { ...card, showFlavorText }
    persist(nextCard)
    set({ card: nextCard, past: nextPast, future: [] })
  },

  undo: () => {
    const { card, past, future } = get()
    if (past.length === 0) return
    const previous = past[past.length - 1]
    persist(previous)
    set({
      card: previous,
      past: past.slice(0, -1),
      future: [card, ...future].slice(0, HISTORY_LIMIT),
    })
  },

  redo: () => {
    const { card, past, future } = get()
    if (future.length === 0) return
    const next = future[0]
    persist(next)
    set({
      card: next,
      past: [...past, card].slice(-HISTORY_LIMIT),
      future: future.slice(1),
    })
  },

  newCard: () => {
    const nextCard = createBlankCard(DEFAULT_TEMPLATE.id)
    persist(nextCard)
    set({ card: nextCard, past: [], future: [] })
  },

  newCardWithOverrides: (overrides) => {
    const nextCard: Card = { ...createBlankCard(DEFAULT_TEMPLATE.id), ...pickDefined(overrides) }
    persist(nextCard)
    set({ card: nextCard, past: [], future: [] })
  },

  loadCard: (card) => {
    persist(card)
    set({ card, past: [], future: [] })
  },

  loadCardById: (id) => {
    const found = get().library.find((c) => c.id === id)
    if (!found) return false
    get().loadCard(found)
    return true
  },

  saveToLibrary: () => {
    const { card, library } = get()
    const existingIndex = library.findIndex((c) => c.id === card.id)
    const nextLibrary =
      existingIndex >= 0
        ? library.map((c, i) => (i === existingIndex ? card : c))
        : [...library, card]
    if (!saveLibrary(nextLibrary)) {
      window.alert('Could not save to your library: browser storage is full. Try deleting some saved cards first.')
      return false
    }
    set({ library: nextLibrary })
    saveCard({ data: card }).catch((err) => console.error('Failed to record card server-side:', err))
    return true
  },

  deleteFromLibrary: (id) => {
    const nextLibrary = get().library.filter((c) => c.id !== id)
    if (!saveLibrary(nextLibrary)) {
      window.alert('Could not update your library: browser storage is full.')
      return
    }
    set({ library: nextLibrary })
  },

  importCards: (cards) => {
    const { library } = get()
    const merged = [...library]
    for (const card of cards) {
      const idx = merged.findIndex((c) => c.id === card.id)
      if (idx >= 0) merged[idx] = card
      else merged.push(card)
    }
    if (!saveLibrary(merged)) {
      window.alert('Could not import cards: browser storage is full. Try deleting some saved cards first.')
      return
    }
    set({ library: merged })
  },
}))
