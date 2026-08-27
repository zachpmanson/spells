import type { Card } from '../types/card'
import { normalizeCard } from '../types/card'
import type { Deck } from '../types/deck'
import type { SavedCard } from '../server/cardsDb'
import type { SavedDeck } from '../server/decksDb'

const CURRENT_CARD_KEY = 'spells:currentCard'
const LIBRARY_KEY = 'spells:library'
const DECK_LIBRARY_KEY = 'spells:deckLibrary'
const MY_LIBRARY_CACHE_PREFIX = 'spells:myLibrary:'
const MY_LIBRARY_LAST_USER_KEY = 'spells:myLibrary:lastUser'

// Signed-in homepage is server-backed (getMyLibrary). We persist a per-user
// snapshot of that response so returning to the homepage can render the tiles
// synchronously (preserving the view-transition morph), then revalidates
// against the server in the background. Server is always the source of truth;
// this cache is a speed layer only.
export interface MyLibraryCache {
  user: string
  cards: SavedCard[]
  decks: SavedDeck[]
  previews: Record<string, SavedCard[]>
}

// Reads the cache for whichever user was signed in on this browser last, or
// null if there isn't one. Keyed by user so happy the wrong account can't be
// served; identity is reconciled by the whoami() refresh right after mount.
export function loadMyLibraryCache(): MyLibraryCache | null {
  if (!isBrowser()) return null
  const lastUser = localStorage.getItem(MY_LIBRARY_LAST_USER_KEY)
  if (!lastUser) return null
  const raw = localStorage.getItem(MY_LIBRARY_CACHE_PREFIX + lastUser)
  if (!raw) return null
  try {
    return JSON.parse(raw) as MyLibraryCache
  } catch {
    return null
  }
}

export function saveMyLibraryCache(cache: MyLibraryCache): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(MY_LIBRARY_CACHE_PREFIX + cache.user, JSON.stringify(sanitizeLibraryForStorage(cache)))
    localStorage.setItem(MY_LIBRARY_LAST_USER_KEY, cache.user)
  } catch {
    // Cache is best-effort; a quota failure must not break the library.
  }
}

export function clearMyLibraryCache(user: string): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(MY_LIBRARY_CACHE_PREFIX + user)
    if (localStorage.getItem(MY_LIBRARY_LAST_USER_KEY) === user) {
      localStorage.removeItem(MY_LIBRARY_LAST_USER_KEY)
    }
  } catch {
    // best-effort
  }
}

// Server-owned cards/decks reference images by URL, so no data-URL stripping is
// normally needed — keep the guard for parity with saveLibrary in case the
// server ever returns an inline data URI.
function sanitizeLibraryForStorage(cache: MyLibraryCache): MyLibraryCache {
  const strip = (cards: SavedCard[]): SavedCard[] =>
    cards.map((c) => (c.coverImage?.dataUrl.startsWith('data:') ? { ...c, coverImage: null } : c))
  return { ...cache, cards: strip(cache.cards), previews: Object.fromEntries(Object.entries(cache.previews).map(([k, v]) => [k, strip(v)])) }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function loadCurrentCard(): Card | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(CURRENT_CARD_KEY)
  if (!raw) return null
  try {
    return normalizeCard(JSON.parse(raw) as Card)
  } catch {
    return null
  }
}

function isQuotaExceededError(err: unknown): boolean {
  return err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
}

// Base64 data URLs can be megabytes each — persisting those blows the localStorage quota
// almost immediately. Uploaded/generated images are stored server-side and referenced by
// URL (see server/imageStorage.ts), so only a raw `data:` URI (e.g. a card imported before
// that existed, or a failed upload) needs to be stripped before writing to storage.
function sanitizeCardForStorage(card: Card): Card {
  if (card.coverImage?.dataUrl.startsWith('data:')) {
    return { ...card, coverImage: null }
  }
  return card
}

export function saveCurrentCard(card: Card): boolean {
  if (!isBrowser()) return true
  try {
    localStorage.setItem(CURRENT_CARD_KEY, JSON.stringify(sanitizeCardForStorage(card)))
    return true
  } catch (err) {
    if (isQuotaExceededError(err)) return false
    throw err
  }
}

export function loadLibrary(): Card[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(LIBRARY_KEY)
  if (!raw) return []
  try {
    return (JSON.parse(raw) as Card[]).map(normalizeCard)
  } catch {
    return []
  }
}

export function saveLibrary(cards: Card[]): boolean {
  if (!isBrowser()) return true
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(cards.map(sanitizeCardForStorage)))
    return true
  } catch (err) {
    if (isQuotaExceededError(err)) return false
    throw err
  }
}

export function loadDeckLibrary(): Deck[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(DECK_LIBRARY_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Deck[]
  } catch {
    return []
  }
}

export function saveDeckLibrary(decks: Deck[]): boolean {
  if (!isBrowser()) return true
  try {
    localStorage.setItem(DECK_LIBRARY_KEY, JSON.stringify(decks))
    return true
  } catch (err) {
    if (isQuotaExceededError(err)) return false
    throw err
  }
}

export function exportCardAsJson(card: Card): void {
  const blob = new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${card.title || 'card'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportLibraryAsJson(cards: Card[]): void {
  const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'spells-library.json'
  a.click()
  URL.revokeObjectURL(url)
}

export async function importCardsFromFile(file: File): Promise<Card[]> {
  const text = await file.text()
  const parsed = JSON.parse(text)
  return (Array.isArray(parsed) ? parsed : [parsed]).map(normalizeCard)
}
