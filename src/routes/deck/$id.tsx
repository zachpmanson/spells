import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CardPreview } from '../../components/CardPreview'
import { Button } from '../../components/Button'
import { useDeckStore } from '../../lib/deckStore'
import { getDeck } from '../../server/getDeck'
import { saveDeck } from '../../server/saveDeck'
import { generateDeckOgImage } from '../../lib/export'
import { PUBLIC_ORIGIN } from '../../lib/origin'
import type { CardNavState } from '../card/$id'

export const Route = createFileRoute('/deck/$id')({
  loader: ({ params }) => getDeck({ data: { publicId: params.id } }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.deck.title ? `${loaderData.deck.title} - Spells` : 'Spells' },
      ...(loaderData
        ? [
            { property: 'og:locale', content: 'en_AU' },
            { property: 'og:url', content: `${PUBLIC_ORIGIN}/deck/${loaderData.deck.publicId}` },
          ]
        : []),
      // OpenGraph/twitter preview so shared deck links embed a deck cover.
      ...(loaderData?.deck.ogImage
        ? [
            { property: 'og:title', content: loaderData.deck.title || 'Spells deck' },
            { property: 'og:type', content: 'website' },
            { property: 'og:image', content: `${PUBLIC_ORIGIN}${loaderData.deck.ogImage}` },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:image', content: `${PUBLIC_ORIGIN}${loaderData.deck.ogImage}` },
          ]
        : []),
    ],
  }),
  component: DeckViewRoute,
})

function DeckViewRoute() {
  const { id } = Route.useParams()
  const data = Route.useLoaderData()
  const hydrateDecksFromStorage = useDeckStore((s) => s.hydrateDecksFromStorage)
  const deckLibrary = useDeckStore((s) => s.deckLibrary)
  const adoptDeck = useDeckStore((s) => s.adoptDeck)
  const setDeckOgImage = useDeckStore((s) => s.setDeckOgImage)
  const [hydrated, setHydrated] = useState(false)
  const [shareJustCopied, setShareJustCopied] = useState(false)
  const shareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const deckOgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hydrateDecksFromStorage()
    setHydrated(true)
  }, [hydrateDecksFromStorage])

  useEffect(() => {
    return () => {
      clearTimeout(shareCopiedTimeoutRef.current)
    }
  }, [])

  // Adopt a shared deck into this browser's collection automatically (deduped
  // by publicId). It stays a redacted copy — deleting it locally never touches
  // the shared original.
  useEffect(() => {
    if (!hydrated || !data) return
    if (deckLibrary.some((d) => d.publicId === data.deck.publicId)) return
    adoptDeck(data.deck)
  }, [hydrated, data, deckLibrary, adoptDeck])

  // A deck you can actually edit: present in the local library AND holding the
  // real editId. Adopted shared decks carry a redacted editId, so they're
  // viewable/forkable but not editable.
  const ownedDeck =
    hydrated && data ? deckLibrary.find((d) => d.publicId === data.deck.publicId && Boolean(d.editId)) : undefined
  const navigate = useNavigate()
  const forkDeck = useDeckStore((s) => s.forkDeck)
  const [forking, setForking] = useState(false)

  // Backfill: generate an OG deck cover for owned decks that don't have one yet
  // (e.g. created before the feature). Gated on ownership (real editId) so we
  // never render/save a cover for a deck we don't own, and it needs cards to
  // show anything meaningful.
  useEffect(() => {
    if (!hydrated || !ownedDeck || ownedDeck.ogImage || !data || data.cards.length === 0) return
    if (!deckOgRef.current) return
    let cancelled = false
    ;(async () => {
      const ogImage = await generateDeckOgImage(deckOgRef.current!)
      if (cancelled || !ogImage) return
      setDeckOgImage(ownedDeck.publicId, ogImage)
      try {
        await saveDeck({ data: { ...ownedDeck, ogImage } })
      } catch (err) {
        console.error('Failed to save deck preview image:', err)
      }
    })()
    return () => {
      cancelled = true
    }
    // setDeckOgImage is a stable zustand action — no need to re-run on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, ownedDeck, data])

  async function handleFork() {
    if (!data || forking) return
    setForking(true)
    try {
      const deck = await forkDeck(data.deck.publicId)
      if (deck) navigate({ to: '/deck/edit/$id', params: { id: deck.editId } })
    } catch (err) {
      console.error('Failed to fork deck:', err)
      window.alert('Could not fork this deck.')
    } finally {
      setForking(false)
    }
  }

  async function handleCopyShareLink() {
    if (!data) return
    await navigator.clipboard.writeText(`${window.location.origin}/deck/${data.deck.publicId}`)
    setShareJustCopied(true)
    clearTimeout(shareCopiedTimeoutRef.current)
    shareCopiedTimeoutRef.current = setTimeout(() => setShareJustCopied(false), 2000)
  }

  return (
    <div className="library-page">
      <div className="library-header">
        <Button to="/">
          <span style={{ viewTransitionName: 'library-title' }}>Library</span>
        </Button>
        {data && <h1>{data.deck.title || 'Untitled deck'}</h1>}
        {data && (
          <div className="library-header-actions">
            {ownedDeck && (
              <>
                <Button onClick={handleCopyShareLink}>{shareJustCopied ? 'Copied ✓' : 'Copy Share Link'}</Button>
                <Button to="/deck/edit/$id" params={{ id: ownedDeck.editId }}>
                  Edit
                </Button>
              </>
            )}
            <Button onClick={handleFork} disabled={forking}>
              {forking ? 'Forking…' : 'Fork'}
            </Button>
          </div>
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
                  // Cast needed: HistoryState isn't augmented with our custom field (that
                  // needs @tanstack/history as a direct dependency, bumping the Nix-pinned
                  // pnpm lockfile hash). `satisfies` still checks the literal's shape.
                  state={({ fromDeckId: id } satisfies CardNavState) as any}
                  className="library-grid-item-preview"
                  title={`View ${card.title || 'Untitled'}`}
                >
                  <CardPreview card={card} transitionName={`deck-${id}-card-${card.publicId}`} />
                </Link>
                <div className="library-grid-item-footer">
                  <span>{card.title || 'Untitled'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Hidden, off-screen deck cover used to render the OpenGraph preview
          image (see generateDeckOgImage). Kept out of view; only meaningful
          when the deck has cards. */}
      <div ref={deckOgRef} className="deck-og-cover" aria-hidden>
        <div className="deck-og-title">{data?.deck.title || 'Untitled deck'}</div>
        <div className="deck-og-fan">
          {(data?.cards ?? []).slice(0, 3).map((card) => (
            <div className="deck-og-card" key={card.publicId}>
              <CardPreview card={card} />
            </div>
          ))}
        </div>
        {(data?.cards.length ?? 0) > 3 && (
          <div className="deck-og-more">+{(data?.cards.length ?? 0) - 3} more</div>
        )}
      </div>
    </div>
  )
}
