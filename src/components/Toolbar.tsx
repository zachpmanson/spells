import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCardStore } from '../lib/cardStore'
import { useDeckStore } from '../lib/deckStore'
import { exportCardAsJson, importCardsFromFile } from '../lib/persistence'
import { exportCardCanvasAsPng } from '../lib/export'
import { Button } from './Button'

const NEW_DECK_OPTION = '__new__'

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
  onOpenModelSettings: () => void
}

export function Toolbar({ canvasRef, onOpenModelSettings }: ToolbarProps) {
  const navigate = useNavigate()
  const card = useCardStore((s) => s.card)
  const newCard = useCardStore((s) => s.newCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const importCards = useCardStore((s) => s.importCards)
  const [justSaved, setJustSaved] = useState(false)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [justCopied, setJustCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const createDeck = useDeckStore((s) => s.createDeck)
  const addCardToDeck = useDeckStore((s) => s.addCardToDeck)
  const [justAddedToDeck, setJustAddedToDeck] = useState(false)
  const addedToDeckTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    hydrateDecksFromStorage()
  }, [hydrateDecksFromStorage])

  useEffect(() => {
    return () => {
      clearTimeout(savedTimeoutRef.current)
      clearTimeout(copiedTimeoutRef.current)
      clearTimeout(addedToDeckTimeoutRef.current)
    }
  }, [])

  function handleSaveToLibrary() {
    const saved = saveToLibrary()
    if (saved) {
      setJustSaved(true)
      clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000)
    }
  }

  async function handleCopyShareLink() {
    const publicId = card.publicId ?? (saveToLibrary() ? useCardStore.getState().card.publicId : null)
    if (!publicId) return
    await navigator.clipboard.writeText(`${window.location.origin}/card/${publicId}`)
    setJustCopied(true)
    clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setJustCopied(false), 2000)
  }

  async function handleAddToDeck(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    e.target.value = ''
    if (!value) return

    const publicId = card.publicId ?? (saveToLibrary() ? useCardStore.getState().card.publicId : null)
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
      setJustAddedToDeck(true)
      clearTimeout(addedToDeckTimeoutRef.current)
      addedToDeckTimeoutRef.current = setTimeout(() => setJustAddedToDeck(false), 2000)
    } catch (err) {
      console.error('Failed to add card to deck:', err)
      window.alert('Could not add this card to that deck.')
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const cards = await importCardsFromFile(file)
    importCards(cards)
    e.target.value = ''
  }

  return (
    <div className="toolbar">
      <Button onClick={() => navigate({ to: '/' })}>Library</Button>
      <Button onClick={onOpenModelSettings}>Settings</Button>
      <Button onClick={handleSaveToLibrary}>{justSaved ? 'Saved ✓' : 'Save to library'}</Button>
      <Button onClick={handleCopyShareLink}>{justCopied ? 'Copied ✓' : 'Copy Read Only Link'}</Button>
      <select className="btn add-to-deck-select" value="" onChange={handleAddToDeck} aria-label="Add to deck">
        <option value="" disabled>
          {justAddedToDeck ? 'Added ✓' : 'Add to deck…'}
        </option>
        {deckLibrary.map((deck) => (
          <option key={deck.id} value={deck.editId}>
            {deck.title || 'Untitled deck'}
          </option>
        ))}
        <option value={NEW_DECK_OPTION}>+ New deck…</option>
      </select>
      <Button onClick={() => exportCardAsJson(card)}>Export JSON</Button>
      <label className="btn import-label">
        Import JSON
        <input type="file" accept="application/json" onChange={handleImport} />
      </label>
      <Button onClick={() => canvasRef.current && exportCardCanvasAsPng(canvasRef.current, card.title)}>
        Export PNG
      </Button>
      <Button className="toolbar-spacer-btn" onClick={newCard}>
        New card
      </Button>
    </div>
  )
}
