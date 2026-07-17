import { createFileRoute, Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { Button } from '../../components/Button'
import { CardPreview } from '../../components/CardPreview'
import { Pagination } from '../../components/Pagination'
import { listDecks } from '../../server/listDecks'

const PAGE_SIZE = 24

function asPage(value: unknown): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 0 ? page : 0
}

export const Route = createFileRoute('/admin/decks')({
  validateSearch: (search: Record<string, unknown>) => ({ page: asPage(search.page) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => listDecks({ data: { page: deps.page } }),
  head: () => ({
    meta: [{ title: 'All decks - Spells' }],
  }),
  component: AdminDecksRoute,
})

function AdminDecksRoute() {
  const { decks, total, previews } = Route.useLoaderData()
  const { page } = Route.useSearch()

  return (
    <div className="library-page">
      <div className="library-header">
        <Button to="/">Library</Button>
        <h1>All decks ({total})</h1>
      </div>
      <div className="library-content">
        {decks.length === 0 ? (
          <p>No decks have been saved yet.</p>
        ) : (
          <ul className="library-grid">
            {decks.map((deck) => {
              const previewCards = previews[deck.publicId] ?? []
              return (
                <li key={deck.publicId} className="library-grid-item">
                  <Link
                    to="/deck/$id"
                    params={{ id: deck.publicId }}
                    className="library-grid-item-preview deck-stack"
                    title={`View ${deck.title || 'Untitled deck'}`}
                  >
                    {previewCards.length === 0 ? (
                      <div className="deck-stack-empty">No cards yet</div>
                    ) : (
                      previewCards.map((card, i, arr) => (
                        <div
                          key={card.publicId}
                          className="deck-stack-card"
                          style={{ '--fan-i': i - (arr.length - 1) / 2 } as CSSProperties}
                        >
                          <CardPreview card={card} transitionName={`deck-${deck.publicId}-card-${card.publicId}`} />
                        </div>
                      ))
                    )}
                  </Link>
                  <div className="library-grid-item-footer library-grid-item-footer-stacked">
                    <span>{deck.title || 'Untitled deck'}</span>
                    <div className="library-grid-item-meta">
                      <span>{new Date(deck.updatedAt).toLocaleString()}</span>
                      <Link to="/deck/edit/$id" params={{ id: deck.editId }}>
                        Edit
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  )
}
