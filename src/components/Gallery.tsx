import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type CSSProperties } from 'react';
import { useCardStore } from '../lib/cardStore';
import { useDeckStore } from '../lib/deckStore';
import { getSavedCardIds } from '../server/listSavedCardIds';
import { listDeckCardPreviews } from '../server/listDeckCardPreviews';
import type { SavedCard } from '../server/cardsDb';
import { Button } from './Button';
import { CardPreview } from './CardPreview';

export function Gallery() {
  const navigate = useNavigate()
  const library = useCardStore((s) => s.library)
  const deleteFromLibrary = useCardStore((s) => s.deleteFromLibrary)
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const createDeck = useDeckStore((s) => s.createDeck)
  const deleteDeckFromLibrary = useDeckStore((s) => s.deleteDeckFromLibrary)
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null)
  const [deckPreviews, setDeckPreviews] = useState<Record<string, SavedCard[]>>({})

  useEffect(() => {
    getSavedCardIds()
      .then((ids) => setSavedIds(new Set(ids)))
      .catch((err) => console.error('Failed to check which cards are saved:', err))
  }, [])

  useEffect(() => {
    hydrateDecksFromStorage()
  }, [hydrateDecksFromStorage])

  useEffect(() => {
    if (deckLibrary.length === 0) return
    listDeckCardPreviews({ data: { deckPublicIds: deckLibrary.map((d) => d.publicId) } })
      .then(setDeckPreviews)
      .catch((err) => console.error('Failed to load deck previews:', err))
  }, [deckLibrary])

  async function handleNewDeck() {
    const title = window.prompt('Deck name:')
    if (!title) return
    const deck = await createDeck(title)
    if (deck) navigate({ to: '/deck/edit/$id', params: { id: deck.editId } })
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Library</h1>
        <div className="library-header-actions">
          <Button onClick={handleNewDeck}>New deck</Button>
          <Button onClick={() => navigate({ to: '/edit' })}>New card</Button>
        </div>
      </div>
      <div className="library-content">
        <div className="library-section-header">
          <h2>Decks</h2>
        </div>
        {deckLibrary.length === 0 ? (
          <p>No decks yet.</p>
        ) : (
          <ul className="library-grid deck-grid">
            {deckLibrary.map((deck) => {
              const previewCards = deckPreviews[deck.publicId] ?? []
              return (
                <li key={deck.id} className="library-grid-item">
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
                          window.confirm(
                            `Remove "${deck.title || 'Untitled deck'}" from your library? The deck itself won't be deleted.`,
                          )
                        ) {
                          deleteDeckFromLibrary(deck.id)
                        }
                      }}
                    >
                      🗑️
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="library-section-header">
          <h2>Cards</h2>
        </div>
        {library.length === 0 ? (
          <p>No saved cards yet.</p>
        ) : (
          <ul className="library-grid">
            {library.map((card) => (
              <li key={card.id} className="library-grid-item">
                <button
                  type="button"
                  className="library-grid-item-preview"
                  onClick={() =>
                    card.publicId
                      ? navigate({ to: '/card/$id', params: { id: card.publicId } })
                      : navigate({ to: '/edit/$id', params: { id: card.id } })
                  }
                  title={`View ${card.title || 'Untitled'}`}
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
