import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { CardPreview } from '../../../components/CardPreview'
import { Button } from '../../../components/Button'
import { useDeckStore } from '../../../lib/deckStore'
import { getDeckForEdit } from '../../../server/getDeckForEdit'
import { removeCardFromDeck } from '../../../server/removeCardFromDeck'
import type { SavedCard } from '../../../server/cardsDb'

export const Route = createFileRoute('/deck/edit/$id')({
  loader: ({ params }) => getDeckForEdit({ data: { editId: params.id } }),
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
  const renameDeck = useDeckStore((s) => s.renameDeck)

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
        <Button to="/">Library</Button>
        {data && (
          <>
            <input
              className="deck-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Deck name"
            />
            <div className="library-header-actions">
              <Button onClick={handleSaveTitle} disabled={savingTitle || !title || title === savedTitle}>
                Save
              </Button>
              <Button to="/deck/$id" params={{ id: data.deck.publicId }}>
                View
              </Button>
            </div>
          </>
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
