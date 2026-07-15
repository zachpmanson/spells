import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CardCanvas } from '../../components/CardCanvas'
import { useCardStore } from '../../lib/cardStore'
import { getCard } from '../../server/getCard'
import { exportCardCanvasAsPng } from '../../lib/export'
import { exportCardAsJson } from '../../lib/persistence'
import type { Card } from '../../types/card'

export const Route = createFileRoute('/card/$id')({
  loader: ({ params }) => getCard({ data: { id: params.id } }),
  component: CardViewRoute,
})

function CardViewRoute() {
  const { id } = Route.useParams()
  const card = Route.useLoaderData()
  const navigate = useNavigate()
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCard = useCardStore((s) => s.loadCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const library = useCardStore((s) => s.library)
  const previewRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    hydrateFromStorage()
    setHydrated(true)
  }, [hydrateFromStorage])

  const isOwnCard = hydrated && library.some((c) => c.id === id)

  function handleFork() {
    if (!card) return
    const forked: Card = {
      id: crypto.randomUUID(),
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
    navigate({ to: '/edit/$id', params: { id: forked.id } })
  }

  return (
    <div className="card-view-page">
      <div className="toolbar">
        <button type="button" className="btn" onClick={() => navigate({ to: '/' })}>
          Library
        </button>
        {card && (
          <>
            <span className="card-view-title">{card.title || 'Untitled'}</span>
            <div className="card-view-actions toolbar-spacer-btn">
              {isOwnCard && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigate({ to: '/edit/$id', params: { id } })}
                >
                  Edit
                </button>
              )}
              <button type="button" className="btn" onClick={handleFork}>
                Fork
              </button>
              <button type="button" className="btn" onClick={() => exportCardAsJson(card)}>
                Export JSON
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => previewRef.current && exportCardCanvasAsPng(previewRef.current, card.title)}
              >
                Export PNG
              </button>
            </div>
          </>
        )}
      </div>
      <div className="card-view-body">
        {card ? (
          <div className="app-canvas-wrapper">
            <CardCanvas ref={previewRef} card={card} readOnly />
          </div>
        ) : (
          <p>Card not found.</p>
        )}
      </div>
    </div>
  )
}
