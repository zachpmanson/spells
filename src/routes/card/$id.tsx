import { createFileRoute, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CardCanvas } from '../../components/CardCanvas'
import { Button } from '../../components/Button'
import { AddToDeckSelect } from '../../components/AddToDeckSelect'
import { useCardStore } from '../../lib/cardStore'
import { useDeckStore } from '../../lib/deckStore'
import { getCard } from '../../server/getCard'
import { listDecksContainingCard } from '../../server/listDecksContainingCard'
import { exportCardCanvasAsPng, generateCardOgImage } from '../../lib/export'
import { exportCardAsJson } from '../../lib/persistence'
import { saveCard } from '../../server/saveCard'
import { PUBLIC_ORIGIN } from '../../lib/origin'
import type { Card } from '../../types/card'

// Ephemeral navigation context (carried via router location state, not the
// URL, so shareable /card/$id links stay clean) — lets this page pick a
// view-transition-name matching whichever element it actually navigated from.
export interface CardNavState {
  fromDeckId?: string
  fromDeckTitle?: string
}

export const Route = createFileRoute('/card/$id')({
  loader: ({ params }) => getCard({ data: { publicId: params.id } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title ? `${loaderData.title} - Spells` : 'Spells' },
      // Card flavour text becomes the page/metadata description.
      ...(loaderData
        ? [
            { property: 'og:locale', content: 'en_AU' },
            { property: 'og:url', content: `${PUBLIC_ORIGIN}/card/${loaderData.publicId}` },
            { property: 'og:logo', content: `${PUBLIC_ORIGIN}/favicon.svg` },
            {
              name: 'description',
              content: loaderData.flavorText.trim() || loaderData.typeLine || loaderData.title || 'A custom card made with Spells',
            },
            {
              property: 'og:description',
              content: loaderData.flavorText.trim() || loaderData.typeLine || loaderData.title || 'A custom card made with Spells',
            },
            {
              name: 'twitter:description',
              content: loaderData.flavorText.trim() || loaderData.typeLine || loaderData.title || 'A custom card made with Spells',
            },
          ]
        : []),
      // OpenGraph/twitter preview so shared card links embed the card image.
      ...(loaderData?.ogImage
        ? [
            { property: 'og:title', content: loaderData.title || 'Spells card' },
            { property: 'og:type', content: 'website' },
            { property: 'og:image', content: `${PUBLIC_ORIGIN}${loaderData.ogImage}` },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:image', content: `${PUBLIC_ORIGIN}${loaderData.ogImage}` },
          ]
        : []),
    ],
  }),
  component: CardViewRoute,
})

function CardViewRoute() {
  const { id } = Route.useParams()
  const card = Route.useLoaderData()
  const navigate = useNavigate()
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const navState = useLocation({ select: (location) => location.state as CardNavState | undefined })
  const fromDeckId = navState?.fromDeckId
  // Deck title for the breadcrumb: prefer the one carried through nav state
  // (synchronous on first render, so the view-transition morph isn't starved
  // by deck-store hydration); fall back to the local deck library.
  const deckBreadcrumbTitle =
    navState?.fromDeckTitle ?? (fromDeckId ? deckLibrary.find((d) => d.publicId === fromDeckId)?.title : undefined)
  const transitionName = fromDeckId ? `deck-${fromDeckId}-card-${id}` : `card-${id}`
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCard = useCardStore((s) => s.loadCard)
  const saveToLibrary = useCardStore((s) => s.saveToLibrary)
  const importCards = useCardStore((s) => s.importCards)
  const library = useCardStore((s) => s.library)
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const previewRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [memberDeckIds, setMemberDeckIds] = useState<Set<string>>(new Set())
  const [shareJustCopied, setShareJustCopied] = useState(false)
  const shareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(shareCopiedTimeoutRef.current)
    }
  }, [])

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

  // A card you can actually edit. Two sources, either of which qualifies:
  //  - the loader's card carries a real editId because the edge-authenticated
  //    caller is the owner (getCard returns the unredacted card to them), so
  //    Edit shows even on a fresh device / direct share link; or
  //  - the card is already in this browser's localStorage library holding a
  //    real editId (cards adopted from a share link carry a redacted editId, so
  //    they're viewable/forkable but not editable).
  const serverOwned = card?.editId ? card : undefined
  const ownedCard = serverOwned ?? (hydrated ? library.find((c) => c.publicId === id && Boolean(c.editId)) : undefined)
  const memberDecks = deckLibrary.filter((d) => memberDeckIds.has(d.publicId))

  // Backfill: render the OpenGraph preview for owned cards that don't have one
  // yet (e.g. saved before the feature). Ownership is enforced by saveCard's
  // server-side editId check, so we only ever touch cards in our own library.
  useEffect(() => {
    if (!card || !ownedCard || ownedCard.ogImage || !previewRef.current) return
    let cancelled = false
    ;(async () => {
      const ogImage = await generateCardOgImage(previewRef.current!)
      if (cancelled || !ogImage) return
      const updated = { ...ownedCard, ogImage }
      useCardStore.getState().importCards([updated])
      try {
        await saveCard({ data: updated })
      } catch (err) {
        console.error('Failed to save card preview image:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [card, ownedCard])

  // Adopt a shared card into this browser's collection automatically: visiting
  // a share link adds it to localStorage (deduped by publicId). It stays a
  // redacted copy — deleting it locally never touches the shared original.
  useEffect(() => {
    if (!hydrated || !card) return
    if (library.some((c) => c.publicId === id)) return
    importCards([card])
  }, [hydrated, card, id, library, importCards])

  async function handleCopyShareLink() {
    if (!card) return
    await navigator.clipboard.writeText(`${window.location.origin}/card/${card.publicId}`)
    setShareJustCopied(true)
    clearTimeout(shareCopiedTimeoutRef.current)
    shareCopiedTimeoutRef.current = setTimeout(() => setShareJustCopied(false), 2000)
  }

  async function handleFork() {
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
      skillBody: card.skillBody,
    }
    loadCard(forked)
    await saveToLibrary()
    navigate({ to: '/edit/$id', params: { id: forked.editId } })
  }

  function handleDownloadSkill() {
    if (!card || !card.skillBody) return
    const blob = new Blob([card.skillBody], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${card.title || 'card'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card-view-page">
      <div className="toolbar">
        <Button to="/">
          <span style={{ viewTransitionName: 'library-title' }}>Library</span>
        </Button>
        {fromDeckId && (
          <Button to="/deck/$id" params={{ id: fromDeckId }}>
            <span style={{ viewTransitionName: `deck-${fromDeckId}-title` }}>
              {deckBreadcrumbTitle || 'Untitled deck'}
            </span>
          </Button>
        )}
        {card && (
          <>
            <span className="card-view-title">{card.title || 'Untitled'}</span>
            <div className="card-view-actions toolbar-spacer-btn">
              {ownedCard && (
                <>
                  <Button to="/edit/$id" params={{ id: ownedCard.editId }}>
                    Edit
                  </Button>
                  <Button onClick={handleCopyShareLink}>{shareJustCopied ? 'Copied ✓' : 'Copy Share Link'}</Button>
                </>
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
          <>
            <div className="app-canvas-wrapper">
              <CardCanvas ref={previewRef} card={card} readOnly transitionName={transitionName} />
            </div>
            {card.skillBody.trim().length > 0 && (
              <details className="card-view-skill" open>
                <summary>
                  <span>Skill body</span>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); handleDownloadSkill() }}>
                    Download
                  </Button>
                </summary>
                <pre className="card-view-skill-text">{card.skillBody}</pre>
              </details>
            )}
          </>
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
