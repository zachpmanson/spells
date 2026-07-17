import { createFileRoute, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CardCanvas } from '../../components/CardCanvas'
import { Button } from '../../components/Button'
import { AddToDeckSelect } from '../../components/AddToDeckSelect'
import { useCardStore } from '../../lib/cardStore'
import { useDeckStore } from '../../lib/deckStore'
import { getCard } from '../../server/getCard'
import { listDecksContainingCard } from '../../server/listDecksContainingCard'
import { exportCardCanvasAsPng } from '../../lib/export'
import { exportCardAsJson } from '../../lib/persistence'
import type { Card } from '../../types/card'

// Ephemeral navigation context (carried via router location state, not the
// URL, so shareable /card/$id links stay clean) — lets this page pick a
// view-transition-name matching whichever element it actually navigated from.
export interface CardNavState {
  fromDeckId?: string
}

export const Route = createFileRoute('/card/$id')({
  loader: ({ params }) => getCard({ data: { publicId: params.id } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title ? `${loaderData.title} - Spells` : 'Spells' }],
  }),
  component: CardViewRoute,
})

function CardViewRoute() {
  const { id } = Route.useParams()
  const card = Route.useLoaderData()
  const navigate = useNavigate()
  const fromDeckId = useLocation({ select: (location) => (location.state as CardNavState).fromDeckId })
  const transitionName = fromDeckId ? `deck-${fromDeckId}-card-${id}` : `card-${id}`
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCard = useCardStore((s) => s.loadCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const library = useCardStore((s) => s.library)
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const previewRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [memberDeckIds, setMemberDeckIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    hydrateFromStorage()
    hydrateDecksFromStorage()
    setHydrated(true)
  }, [hydrateFromStorage, hydrateDecksFromStorage])

  useEffect(() => {
    if (!hydrated || deckLibrary.length === 0) return
    listDecksContainingCard({ data: { cardPublicId: id, deckPublicIds: deckLibrary.map((d) => d.publicId) } })
      .then((ids) => setMemberDeckIds(new Set(ids)))
      .catch((err) => console.error('Failed to check deck membership:', err))
  }, [hydrated, deckLibrary, id])

  const ownedCard = hydrated ? library.find((c) => c.publicId === id) : undefined
  const memberDecks = deckLibrary.filter((d) => memberDeckIds.has(d.publicId))

  function handleFork() {
    if (!card) return
    const forked: Card = {
      id: crypto.randomUUID(),
      publicId: null,
      editId: crypto.randomUUID(),
      templateId: card.templateId,
      title: card.title,
      manaCost: card.manaCost,
      typeLine: card.typeLine,
      rulesText: card.rulesText,
      flavorText: card.flavorText,
      showFlavorText: card.showFlavorText,
      powerToughness: card.powerToughness,
      coverImage: card.coverImage,
    }
    loadCard(forked)
    saveToLibrary()
    navigate({ to: '/edit/$id', params: { id: forked.editId } })
  }

  return (
    <div className="card-view-page">
      <div className="toolbar">
        <Button to="/">
          <span style={{ viewTransitionName: 'library-title' }}>Library</span>
        </Button>
        {card && (
          <>
            <span className="card-view-title">{card.title || 'Untitled'}</span>
            <div className="card-view-actions toolbar-spacer-btn">
              {ownedCard && (
                <Button to="/edit/$id" params={{ id: ownedCard.editId }}>
                  Edit
                </Button>
              )}
              <Button onClick={handleFork}>Fork</Button>
              <AddToDeckSelect getCardPublicId={() => id} />
              <Button onClick={() => exportCardAsJson(card)}>Export JSON</Button>
              <Button
                onClick={() => previewRef.current && exportCardCanvasAsPng(previewRef.current, card.title)}
              >
                Export PNG
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="card-view-body">
        {card ? (
          <div className="app-canvas-wrapper">
            <CardCanvas ref={previewRef} card={card} readOnly transitionName={transitionName} />
          </div>
        ) : (
          <p>Card not found.</p>
        )}
      </div>
      {memberDecks.length > 0 && (
        <div className="card-view-decks">
          <span>In your decks:</span>
          {memberDecks.map((deck) => (
            <Link key={deck.id} to="/deck/$id" params={{ id: deck.publicId }} className="card-sync-badge card-sync-badge-saved">
              {deck.title || 'Untitled deck'}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
