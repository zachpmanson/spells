import type { Card } from '../types/card'

const CURRENT_CARD_KEY = 'spells:currentCard'
const LIBRARY_KEY = 'spells:library'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function loadCurrentCard(): Card | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(CURRENT_CARD_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Card
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
    return JSON.parse(raw) as Card[]
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
  return Array.isArray(parsed) ? parsed : [parsed]
}
