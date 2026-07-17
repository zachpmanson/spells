import type { Card } from '../types/card'
import { Button } from './Button'
import { CardPreview } from './CardPreview'

interface CardTileProps {
  card: Card
  isSaved: boolean | null
  onOpen: () => void
  onDelete: () => void
}

export function CardTile({ card, isSaved, onOpen, onDelete }: CardTileProps) {
  return (
    <li className="library-grid-item">
      <button
        type="button"
        className="library-grid-item-preview"
        onClick={onOpen}
        title={`View ${card.title || 'Untitled'}`}
      >
        <CardPreview card={card} transitionName={`card-${card.publicId ?? card.id}`} />
      </button>
      <div className="library-grid-item-footer">
        <span>{card.title || 'Untitled'}</span>
        {isSaved !== null && (
          <span
            className={isSaved ? 'card-sync-badge card-sync-badge-saved' : 'card-sync-badge card-sync-badge-local'}
            title={isSaved ? 'Saved to server' : 'Local only — not yet saved to server'}
          >
            {isSaved ? 'Saved' : 'Local only'}
          </span>
        )}
        <Button
          size="sm"
          aria-label={`Delete ${card.title || 'Untitled'}`}
          title="Delete"
          onClick={() => {
            if (window.confirm(`Delete "${card.title || 'Untitled'}"? This can't be undone.`)) {
              onDelete()
            }
          }}
        >
          🗑️
        </Button>
      </div>
    </li>
  )
}
