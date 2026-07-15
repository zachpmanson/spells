import { useNavigate } from '@tanstack/react-router'
import { useCardStore } from '../lib/cardStore'
import { exportCardAsJson, importCardsFromFile } from '../lib/persistence'
import { exportCardCanvasAsPng } from '../lib/export'

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export function Toolbar({ canvasRef }: ToolbarProps) {
  const navigate = useNavigate()
  const card = useCardStore((s) => s.card)
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)
  const newCard = useCardStore((s) => s.newCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const importCards = useCardStore((s) => s.importCards)
  const canUndo = useCardStore((s) => s.past.length > 0)
  const canRedo = useCardStore((s) => s.future.length > 0)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const cards = await importCardsFromFile(file)
    importCards(cards)
    e.target.value = ''
  }

  return (
    <div className="toolbar">
      <button type="button" className="btn" onClick={() => navigate({ to: '/' })}>
        Library
      </button>
      <button type="button" className="btn" onClick={newCard}>
        New card
      </button>
      <button type="button" className="btn" onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button type="button" className="btn" onClick={redo} disabled={!canRedo}>
        Redo
      </button>
      <button type="button" className="btn" onClick={saveToLibrary}>
        Save to library
      </button>
      <button type="button" className="btn" onClick={() => exportCardAsJson(card)}>
        Export JSON
      </button>
      <label className="btn import-label">
        Import JSON
        <input type="file" accept="application/json" onChange={handleImport} />
      </label>
      <button
        type="button"
        className="btn"
        onClick={() => canvasRef.current && exportCardCanvasAsPng(canvasRef.current, card.title)}
      >
        Export PNG
      </button>
    </div>
  )
}
