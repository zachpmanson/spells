import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useCardStore } from '../lib/cardStore'
import { getSavedCardIds } from '../server/listSavedCardIds'
import { CardPreview } from './CardPreview'
import { Button } from './Button'

export function Gallery() {
  const navigate = useNavigate()
  const library = useCardStore((s) => s.library)
  const deleteFromLibrary = useCardStore((s) => s.deleteFromLibrary)
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null)

  useEffect(() => {
    getSavedCardIds()
      .then((ids) => setSavedIds(new Set(ids)))
      .catch((err) => console.error('Failed to check which cards are saved:', err))
  }, [])

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Library</h1>
        <Button onClick={() => navigate({ to: '/edit' })}>New card</Button>
      </div>
      <div className="library-content">
        {library.length === 0 ? (
          <p>No saved cards yet.</p>
        ) : (
          <ul className="library-grid">
            {library.map((card) => (
              <li key={card.id} className="library-grid-item">
                <button
                  type="button"
                  className="library-grid-item-preview"
                  onClick={() => navigate({ to: '/edit/$id', params: { id: card.id } })}
                  title={`Open ${card.title || 'Untitled'}`}
                >
                  <CardPreview card={card} />
                </button>
                <div className="library-grid-item-footer">
                  <span>{card.title || 'Untitled'}</span>
                  {savedIds && (
                    <span
                      className={
                        card.publicId && savedIds.has(card.publicId)
                          ? 'card-sync-badge card-sync-badge-saved'
                          : 'card-sync-badge card-sync-badge-local'
                      }
                      title={card.publicId && savedIds.has(card.publicId) ? 'Saved to server' : 'Local only — not yet saved to server'}
                    >
                      {card.publicId && savedIds.has(card.publicId) ? 'Saved' : 'Local only'}
                    </span>
                  )}
                  <Button
                    size="sm"
                    aria-label={`Delete ${card.title || 'Untitled'}`}
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete "${card.title || 'Untitled'}"? This can't be undone.`)) {
                        deleteFromLibrary(card.id)
                      }
                    }}
                  >
                    🗑️
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
