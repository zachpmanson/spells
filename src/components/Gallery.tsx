import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useCardStore } from '../lib/cardStore';
import { useDeckStore } from '../lib/deckStore';
import { getSavedCardIds } from '../server/listSavedCardIds';
import { Button } from './Button';
import { DeckTile } from './DeckTile';
import { CardTile } from './CardTile';

export function Gallery() {
  const navigate = useNavigate()
  const library = useCardStore((s) => s.library)
  const deleteFromLibrary = useCardStore((s) => s.deleteFromLibrary)
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const deckPreviews = useDeckStore((s) => s.deckPreviews)
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const loadDeckPreviews = useDeckStore((s) => s.loadDeckPreviews)
  const createDeck = useDeckStore((s) => s.createDeck)
  const deleteDeckFromLibrary = useDeckStore((s) => s.deleteDeckFromLibrary)
  const [savedIds, setSavedIds] = useState<Set<string> | null>(null)

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
    loadDeckPreviews(deckLibrary.map((d) => d.publicId)).catch((err) =>
      console.error('Failed to load deck previews:', err),
    )
  }, [deckLibrary, loadDeckPreviews])

  async function handleNewDeck() {
    const title = window.prompt('Deck name:')
    if (!title) return
    const deck = await createDeck(title)
    if (deck) navigate({ to: '/deck/edit/$id', params: { id: deck.editId } })
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>
          <span style={{ viewTransitionName: 'library-title' }}>Library</span>
        </h1>
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
            {deckLibrary.map((deck) => (
              <DeckTile
                key={deck.id}
                deck={deck}
                previewCards={deckPreviews[deck.publicId] ?? []}
                onDelete={() => deleteDeckFromLibrary(deck.id)}
              />
            ))}
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
              <CardTile
                key={card.id}
                card={card}
                isSaved={savedIds ? Boolean(card.publicId && savedIds.has(card.publicId)) : null}
                onOpen={() =>
                  card.publicId
                    ? navigate({ to: '/card/$id', params: { id: card.publicId } })
                    : navigate({ to: '/edit/$id', params: { id: card.editId } })
                }
                onDelete={() => deleteFromLibrary(card.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
