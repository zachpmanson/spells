import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import type { SavedCard } from '../server/cardsDb'
import type { Deck } from '../types/deck'
import { Button } from './Button'
import { CardPreview } from './CardPreview'

interface DeckTileProps {
  deck: Deck
  previewCards: SavedCard[]
  onDelete: () => void
}

export function DeckTile({ deck, previewCards, onDelete }: DeckTileProps) {
  return (
    <li className="library-grid-item">
      <Link
        to="/deck/$id"
        params={{ id: deck.publicId }}
        className="library-grid-item-preview deck-stack"
        title={`View ${deck.title || 'Untitled deck'}`}
      >
        {previewCards.length === 0 ? (
          <div className="deck-stack-empty">No cards yet</div>
        ) : (
          previewCards.slice(0, 3).map((card, i, arr) => (
            <div
              key={card.publicId}
              className="deck-stack-card"
              style={{ '--fan-i': i - (arr.length - 1) / 2 } as CSSProperties}
            >
              <CardPreview card={card} />
            </div>
          ))
        )}
      </Link>
      <div className="library-grid-item-footer">
        <span>{deck.title || 'Untitled deck'}</span>
        <Button size="sm" to="/deck/edit/$id" params={{ id: deck.editId }}>
          Edit
        </Button>
        <Button
          size="sm"
          aria-label={`Delete ${deck.title || 'Untitled deck'}`}
          title="Remove from library"
          onClick={() => {
            if (
              window.confirm(`Remove "${deck.title || 'Untitled deck'}" from your library? The deck itself won't be deleted.`)
            ) {
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
