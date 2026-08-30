import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CardPreview } from '../../../components/CardPreview'
import { Button } from '../../../components/Button'
import { useDeckStore } from '../../../lib/deckStore'
import { getDeckForEdit } from '../../../server/getDeckForEdit'
import { removeCardFromDeck } from '../../../server/removeCardFromDeck'
import type { SavedCard } from '../../../server/cardsDb'
import type { CardNavState } from '../../card/$id'
import EditAccessError from '../../../components/EditAccessError'

export const Route = createFileRoute('/deck/edit/$id')({
  loader: ({ params }) => getDeckForEdit({ data: { editId: params.id } }),
  errorComponent: EditAccessError,
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.deck.title ? `Edit ${loaderData.deck.title} - Spells` : 'Spells' }],
  }),
  component: DeckEditRoute,
})

function DeckEditRoute() {
  const { id } = Route.useParams()
  const data = Route.useLoaderData()
  const [cards, setCards] = useState<SavedCard[]>(data?.cards ?? [])
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [title, setTitle] = useState(data?.deck.title ?? '')
  const [savedTitle, setSavedTitle] = useState(data?.deck.title ?? '')
  const [savingTitle, setSavingTitle] = useState(false)
  const [dirty, setDirty] = useState(false)
  const renameDeck = useDeckStore((s) => s.renameDeck)

  // The title input renders unconditionally (so it's in the first commit for
  // the view-transition morph), which means `data` — and with it the deck
  // title — arrives a frame AFTER the field's useState initializers ran. Once
  // the loader data lands, backfill the title — unless the user already typed
  // (dirty), in which case their keystrokes win.
  useEffect(() => {
    if (!data || dirty) return
    setTitle(data.deck.title)
    setSavedTitle(data.deck.title)
  }, [data, dirty])

  async function handleRemove(cardPublicId: string) {
    setRemovingId(cardPublicId)
    try {
      await removeCardFromDeck({ data: { editId: id, cardPublicId } })
      setCards((prev) => prev.filter((c) => c.publicId !== cardPublicId))
    } catch (err) {
      console.error('Failed to remove card from deck:', err)
      window.alert('Could not remove that card from the deck.')
    } finally {
      setRemovingId(null)
    }
  }

  async function handleSaveTitle() {
    setSavingTitle(true)
    try {
      await renameDeck(id, title)
      setSavedTitle(title)
    } catch (err) {
      console.error('Failed to rename deck:', err)
      window.alert('Could not rename this deck.')
    } finally {
      setSavingTitle(false)
    }
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <div className="library-header-left">
          <Button to="/">
            <span style={{ viewTransitionName: 'library-title' }}>Library</span>
          </Button>
          {/* Rendered unconditionally so the input exists in the first commit
              of client-side navigation (loader data lands a frame later, after
              the view-transition new-state snapshot) — same reason the deck
              view page's h1 is unconditional. The transition name needs the
              publicId, which only the loader carries; when that isn't here
              yet there's no morph but the input still renders. */}
          <input
            className="deck-title-input"
            style={data ? { viewTransitionName: `deck-${data.deck.publicId}-title` } : undefined}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setDirty(true)
            }}
            aria-label="Deck name"
          />
        </div>
        {data && (
          <div className="library-header-actions">
            <Button onClick={handleSaveTitle} disabled={savingTitle || !title || title === savedTitle}>
              Save
            </Button>
            <Button to="/deck/$id" params={{ id: data.deck.publicId }}>
              View
            </Button>
          </div>
        )}
      </div>
      <div className="library-content">
        {!data ? (
          <p>Deck not found.</p>
        ) : cards.length === 0 ? (
          <p>This deck has no cards yet.</p>
        ) : (
          <ul className="library-grid">
            {cards.map((card) => (
              <li key={card.publicId} className="library-grid-item">
                <Link
                  to="/card/$id"
                  params={{ id: card.publicId }}
                  state={
                    ({
                      fromDeckId: data.deck.publicId,
                      fromDeckTitle: data.deck.title || undefined,
                    } satisfies CardNavState) as any
                  }
                  className="library-grid-item-preview"
                  title={`View ${card.title || 'Untitled'}`}
                >
                  <CardPreview card={card} />
                </Link>
                <div className="library-grid-item-footer">
                  <span>{card.title || 'Untitled'}</span>
                  <Button
                    size="sm"
                    aria-label={`Remove ${card.title || 'Untitled'}`}
                    title="Remove from deck"
                    disabled={removingId === card.publicId}
                    onClick={() => handleRemove(card.publicId)}
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
