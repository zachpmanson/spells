import { useEffect, useRef, useState } from 'react'
import { useDeckStore } from '../lib/deckStore'
import { listMyDecks } from '../server/listMyDecks'
import type { SavedDeck } from '../server/decksDb'

const NEW_DECK_OPTION = '__new__'

interface AddToDeckSelectProps {
  getCardPublicId: () => string | null
}

export function AddToDeckSelect({ getCardPublicId }: AddToDeckSelectProps) {
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const createDeck = useDeckStore((s) => s.createDeck)
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck)
  const [ownedDecks, setOwnedDecks] = useState<SavedDeck[] | null>(null)
  const [justAdded, setJustAdded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Signed-in: the library (and deck list) live in the DB, not localStorage, so
  // pull the owned decks here. Anonymous falls back to the localStorage deck
  // store. ownedDecks stays null until we resolve: once we know we're anonymous
  // we use deckLibrary as before.
  useEffect(() => {
    let cancelled = false
    listMyDecks()
      .then(({ decks }) => {
        if (!cancelled) setOwnedDecks(decks)
      })
      .catch(() => {
        // 401 (no auth header) -> anonymous visitor -> localStorage view
        if (!cancelled) setOwnedDecks(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  const decks = ownedDecks ?? deckLibrary

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    e.target.value = ''
    if (!value) return

    const publicId = getCardPublicId()
    if (!publicId) return

    let deckEditId = value
    if (value === NEW_DECK_OPTION) {
      const title = window.prompt('Deck name:')
      if (!title) return
      const deck = await createDeck(title)
      if (!deck) return
      deckEditId = deck.editId
    }

    try {
      await addCardToDeck(deckEditId, publicId)
      setJustAdded(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setJustAdded(false), 2000)
    } catch (err) {
      console.error('Failed to add card to deck:', err)
      window.alert('Could not add this card to that deck.')
    }
  }

  return (
    <select className="btn add-to-deck-select" value="" onChange={handleChange} aria-label="Add to deck">
      <option value="" disabled>
        {justAdded ? 'Added ✓' : 'Add to deck…'}
      </option>
      {decks.map((deck) => (
        <option key={deck.id} value={deck.editId}>
          {deck.title || 'Untitled deck'}
        </option>
      ))}
      <option value={NEW_DECK_OPTION}>+ New deck…</option>
    </select>
  )
}
