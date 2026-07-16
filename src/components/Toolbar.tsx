import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCardStore } from '../lib/cardStore'
import { exportCardAsJson, importCardsFromFile } from '../lib/persistence'
import { exportCardCanvasAsPng } from '../lib/export'
import { Button } from './Button'
import { AddToDeckSelect } from './AddToDeckSelect'

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
  const [justCopied, setJustCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(copiedTimeoutRef.current)
    }
  }, [])

  function handleSaveToLibrary() {
    const saved = saveToLibrary()
    if (!saved) return
    const publicId = useCardStore.getState().card.publicId
    // Reset the in-memory card and its persisted cache to blank so a later
    // "New card" from the library doesn't reopen this just-saved card.
    newCard()
    if (publicId) navigate({ to: '/card/$id', params: { id: publicId } })
  }

  async function handleCopyShareLink() {
    const publicId = card.publicId ?? (saveToLibrary() ? useCardStore.getState().card.publicId : null)
    if (!publicId) return
    await navigator.clipboard.writeText(`${window.location.origin}/card/${publicId}`)
    setJustCopied(true)
    clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setJustCopied(false), 2000)
  }

  function getCardPublicId(): string | null {
    return card.publicId ?? (saveToLibrary() ? useCardStore.getState().card.publicId : null)
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
      <Button onClick={handleSaveToLibrary}>Save to library</Button>
      <Button onClick={handleCopyShareLink}>{justCopied ? 'Copied ✓' : 'Copy Read Only Link'}</Button>
      <AddToDeckSelect getCardPublicId={getCardPublicId} />
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
