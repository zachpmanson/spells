import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CardCanvas } from '../../components/CardCanvas'
import { Button } from '../../components/Button'
import { useCardStore } from '../../lib/cardStore'
import { getCard } from '../../server/getCard'
import { exportCardCanvasAsPng } from '../../lib/export'
import { exportCardAsJson } from '../../lib/persistence'
import type { Card } from '../../types/card'

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
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCard = useCardStore((s) => s.loadCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const library = useCardStore((s) => s.library)
  const previewRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [justCopied, setJustCopied] = useState(false)
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    hydrateFromStorage()
    setHydrated(true)
  }, [hydrateFromStorage])

  useEffect(() => {
    return () => clearTimeout(copiedTimeoutRef.current)
  }, [])

  const ownedCard = hydrated ? library.find((c) => c.publicId === id) : undefined

  async function handleCopyShareLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/card/${id}`)
    setJustCopied(true)
    clearTimeout(copiedTimeoutRef.current)
    copiedTimeoutRef.current = setTimeout(() => setJustCopied(false), 2000)
  }

  function handleFork() {
    if (!card) return
    const forked: Card = {
      id: crypto.randomUUID(),
      publicId: null,
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
        <Button to="/">Library</Button>
        {card && (
          <>
            <span className="card-view-title">{card.title || 'Untitled'}</span>
            <div className="card-view-actions toolbar-spacer-btn">
              {ownedCard && (
                <Button to="/edit/$id" params={{ id: ownedCard.id }}>
                  Edit
                </Button>
              )}
              <Button onClick={handleFork}>Fork</Button>
              <Button onClick={handleCopyShareLink}>{justCopied ? 'Copied ✓' : 'Copy share link'}</Button>
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
            <CardCanvas ref={previewRef} card={card} readOnly />
          </div>
        ) : (
          <p>Card not found.</p>
        )}
      </div>
    </div>
  )
}
