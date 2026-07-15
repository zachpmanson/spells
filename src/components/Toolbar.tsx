import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useCardStore } from '../lib/cardStore'
import { exportCardAsJson, importCardsFromFile } from '../lib/persistence'
import { exportCardCanvasAsPng } from '../lib/export'
import { Button } from './Button'

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
  onOpenModelSettings: () => void
}

export function Toolbar({ canvasRef, onOpenModelSettings }: ToolbarProps) {
  const navigate = useNavigate()
  const card = useCardStore((s) => s.card)
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)
  const newCard = useCardStore((s) => s.newCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const importCards = useCardStore((s) => s.importCards)
  const canUndo = useCardStore((s) => s.past.length > 0)
  const canRedo = useCardStore((s) => s.future.length > 0)
  const [justSaved, setJustSaved] = useState(false)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => clearTimeout(savedTimeoutRef.current)
  }, [])

  function handleSaveToLibrary() {
    const saved = saveToLibrary()
    if (saved) {
      setJustSaved(true)
      clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => setJustSaved(false), 2000)
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
      <Button onClick={undo} disabled={!canUndo}>
        Undo
      </Button>
      <Button onClick={redo} disabled={!canRedo}>
        Redo
      </Button>
      <Button onClick={handleSaveToLibrary}>{justSaved ? 'Saved ✓' : 'Save to library'}</Button>
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
