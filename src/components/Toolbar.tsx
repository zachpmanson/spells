import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCardStore } from '../lib/cardStore'
import { exportCardAsJson, importCardsFromFile } from '../lib/persistence'
import { exportCardCanvasAsPng, generateCardOgImage } from '../lib/export'
import { Button } from './Button'

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

  async function handleSaveToLibrary() {
    // Refresh the OpenGraph preview from the current canvas so the shared link
    // always shows the card as saved. Best-effort: failure just means no image.
    if (canvasRef.current) {
      const ogImage = await generateCardOgImage(canvasRef.current)
      if (ogImage) useCardStore.setState((s) => ({ card: { ...s.card, ogImage } }))
    }
    const saved = await saveToLibrary()
    if (!saved) return
    const publicId = useCardStore.getState().card.publicId
    // Reset the in-memory card and its persisted cache to blank so a later
    // "New card" from the library doesn't reopen this just-saved card.
    newCard()
    if (publicId) navigate({ to: '/card/$id', params: { id: publicId } })
  }

  async function handleCopyShareLink() {
    // Only generate if missing (e.g. a card from before the og-image feature
    // that's being shared without an explicit "Save to library").
    if (canvasRef.current && !card.ogImage) {
      const ogImage = await generateCardOgImage(canvasRef.current)
      if (ogImage) useCardStore.setState((s) => ({ card: { ...s.card, ogImage } }))
    }
    const cardWithOg = useCardStore.getState().card
    const publicId =
      cardWithOg.publicId ?? ((await saveToLibrary()) ? useCardStore.getState().card.publicId : null)
    if (!publicId) return
    await navigator.clipboard.writeText(`${window.location.origin}/card/${publicId}`)
    setJustCopied(true)
    clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setJustCopied(false), 2000)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const cards = await importCardsFromFile(file)
    importCards(cards)
    e.target.value = ''
  }

  return (
    <div className="editor-toolbar">
      <div className="toolbar">
        <h1 className="editor-toolbar-title">{card.title ? `Edit ${card.title}` : 'Edit card'}</h1>
        <Button className="toolbar-spacer-btn" onClick={() => navigate({ to: '/' })}>
          Library
        </Button>
        <Button onClick={newCard}>New card</Button>
        <Button onClick={handleSaveToLibrary}>Save to library</Button>
      </div>
      <div className="toolbar">
        <Button onClick={onOpenModelSettings}>Settings</Button>
        <Button onClick={handleCopyShareLink}>{justCopied ? 'Copied ✓' : 'Copy Read Only Link'}</Button>
        <Button onClick={() => exportCardAsJson(card)}>Export JSON</Button>
        <label className="btn import-label">
          Import JSON
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
        <Button onClick={() => canvasRef.current && exportCardCanvasAsPng(canvasRef.current, card.title)}>
          Export PNG
        </Button>
      </div>
    </div>
  )
}
