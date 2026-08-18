import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { CardPreview } from '../../components/CardPreview'
import { Button } from '../../components/Button'
import { useDeckStore } from '../../lib/deckStore'
import { getDeck } from '../../server/getDeck'
import type { CardNavState } from '../card/$id'

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
  const adoptDeck = useDeckStore((s) => s.adoptDeck)
  const [hydrated, setHydrated] = useState(false)
  const [shareJustCopied, setShareJustCopied] = useState(false)
  const shareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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
            <Button onClick={handleCopyShareLink}>{shareJustCopied ? 'Copied ✓' : 'Copy Share Link'}</Button>
            <Button onClick={handleFork} disabled={forking}>
              {forking ? 'Forking…' : 'Fork'}
            </Button>
            {ownedDeck && (
              <Button to="/deck/edit/$id" params={{ id: ownedDeck.editId }}>
                Edit
              </Button>
            )}
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
    </div>
  )
}
