import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useCardStore } from '../lib/cardStore';
import { useDeckStore } from '../lib/deckStore';
import { getSavedCardIds } from '../server/listSavedCardIds';
import { getMyLibrary } from '../server/getMyLibrary';
import { deleteCard as serverDeleteCard } from '../server/deleteCard';
import { deleteDeck as serverDeleteDeck } from '../server/deleteDeck';
import { whoami } from '../server/whoami';
import type { SavedCard } from '../server/cardsDb';
import type { SavedDeck } from '../server/decksDb';
import { Button } from './Button';
import { DeckTile } from './DeckTile';
import { CardTile } from './CardTile';

// Signed-in "my library": the server returns only the rows owned by this user
// (X-Auth-User). Anonymous gets the localStorage-driven view below.
interface MyLibrary {
  cards: SavedCard[]
  decks: SavedDeck[]
  previews: Record<string, SavedCard[]>
}

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

  // Signed-in library state (null = anonymous, use localStorage view).
  const [authed, setAuthed] = useState(false)
  const [myCards, setMyCards] = useState<SavedCard[] | null>(null)
  const [myDecks, setMyDecks] = useState<SavedDeck[] | null>(null)
  const [myPreviews, setMyPreviews] = useState<Record<string, SavedCard[]>>({})

  useEffect(() => {
    getSavedCardIds()
      .then((ids) => setSavedIds(new Set(ids)))
      .catch((err) => console.error('Failed to check which cards are saved:', err))
  }, [])

  // Resolve identity; if signed in, pull the owned library from the server
  // instead of the localStorage decks the anonymous view uses.
  useEffect(() => {
    let cancelled = false
    whoami()
      .then(({ user }) => {
        if (cancelled) return
        if (!user) return // anonymous -> default localStorage view
        setAuthed(true)
        return getMyLibrary().then((lib) => {
          if (cancelled) return
          setMyCards(lib.cards)
          setMyDecks(lib.decks)
          setMyPreviews(lib.previews)
        })
      })
      .catch((err) => console.error('Failed to resolve library:', err))
    return () => {
      cancelled = true
    }
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

  async function handleDeleteCard(cardId: string) {
    const saved = myCards?.find((c) => c.id === cardId)
    if (authed) {
      if (saved?.publicId) {
        await serverDeleteCard({ data: { publicId: saved.publicId } })
        setMyCards((cards) => cards?.filter((c) => c.id !== cardId) ?? null)
      } else {
        // A signed-in library came from the DB, so cards always have publicId;
        // fall back to the local-only path defensively.
        deleteFromLibrary(cardId)
      }
    } else {
      deleteFromLibrary(cardId)
    }
  }

  async function handleDeleteDeck(deckId: string) {
    const deck = authed ? myDecks?.find((d) => d.id === deckId) : deckLibrary.find((d) => d.id === deckId)
    if (authed && deck) {
      await serverDeleteDeck({ data: { publicId: deck.publicId } })
      setMyDecks((prev) => prev?.filter((d) => d.id !== deckId) ?? null)
    } else {
      deleteDeckFromLibrary(deckId)
    }
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
        {authed ? (
          myDecks === null ? (
            <p>Loading your decks…</p>
          ) : myDecks.length === 0 ? (
            <p>No decks yet.</p>
          ) : (
            <ul className="library-grid deck-grid">
              {myDecks.map((deck) => (
                <DeckTile
                  key={deck.id}
                  deck={deck}
                  previewCards={myPreviews[deck.publicId] ?? []}
                  onDelete={() => {
                    if (window.confirm(`Delete "${deck.title || 'Untitled deck'}"? This can't be undone.`)) {
                      handleDeleteDeck(deck.id)
                    }
                  }}
                />
              ))}
            </ul>
          )
        ) : deckLibrary.length === 0 ? (
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
        {authed ? (
          myCards === null ? (
            <p>Loading your cards…</p>
          ) : myCards.length === 0 ? (
            <p>No saved cards yet.</p>
          ) : (
            <ul className="library-grid">
              {myCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  isSaved={savedIds ? savedIds.has(card.publicId) : null}
                  onOpen={() => navigate({ to: '/card/$id', params: { id: card.publicId } })}
                  onDelete={() => {
                    if (window.confirm(`Delete "${card.title || 'Untitled'}"? This can't be undone.`)) {
                      handleDeleteCard(card.id)
                    }
                  }}
                />
              ))}
            </ul>
          )
        ) : library.length === 0 ? (
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