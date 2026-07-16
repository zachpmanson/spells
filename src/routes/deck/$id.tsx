import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CardPreview } from '../../components/CardPreview'
import { Button } from '../../components/Button'
import { useDeckStore } from '../../lib/deckStore'
import { getDeck } from '../../server/getDeck'

export const Route = createFileRoute('/deck/$id')({
  loader: ({ params }) => getDeck({ data: { publicId: params.id } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.deck.title ? `${loaderData.deck.title} - Spells` : 'Spells' }],
  }),
  component: DeckViewRoute,
})

function DeckViewRoute() {
  const { id } = Route.useParams()
  const data = Route.useLoaderData()
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    hydrateDecksFromStorage()
    setHydrated(true)
  }, [hydrateDecksFromStorage])

  const ownedDeck = hydrated ? deckLibrary.find((d) => d.publicId === id) : undefined

  return (
    <div className="library-page">
      <div className="library-header">
        <Button to="/">Library</Button>
        {data && (
          <>
            <h1>{data.deck.title || 'Untitled deck'}</h1>
            {ownedDeck && (
              <Button to="/deck/edit/$id" params={{ id: ownedDeck.editId }}>
                Edit
              </Button>
            )}
          </>
        )}
      </div>
      <div className="library-content">
        {!data ? (
          <p>Deck not found.</p>
        ) : data.cards.length === 0 ? (
          <p>This deck has no cards yet.</p>
        ) : (
          <ul className="library-grid">
            {data.cards.map((card) => (
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
