import { useEffect, useRef, useState } from 'react'
import { useDeckStore } from '../lib/deckStore'

const NEW_DECK_OPTION = '__new__'

interface AddToDeckSelectProps {
  getCardPublicId: () => string | null
}

export function AddToDeckSelect({ getCardPublicId }: AddToDeckSelectProps) {
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const createDeck = useDeckStore((s) => s.createDeck)
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck)
  const [justAdded, setJustAdded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    hydrateDecksFromStorage()
  }, [hydrateDecksFromStorage])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

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
      {deckLibrary.map((deck) => (
        <option key={deck.id} value={deck.editId}>
          {deck.title || 'Untitled deck'}
        </option>
      ))}
      <option value={NEW_DECK_OPTION}>+ New deck…</option>
    </select>
  )
}
