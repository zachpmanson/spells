import { createFileRoute, Link } from '@tanstack/react-router'
import { CardPreview } from '../../components/CardPreview'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { listCards } from '../../server/listCards'

const PAGE_SIZE = 24

function asPage(value: unknown): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 0 ? page : 0
}

export const Route = createFileRoute('/admin/cards')({
  validateSearch: (search: Record<string, unknown>) => ({ page: asPage(search.page) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => listCards({ data: { page: deps.page } }),
  head: () => ({
    meta: [{ title: 'All cards - Spells' }],
  }),
  component: AdminCardsRoute,
})

function AdminCardsRoute() {
  const { cards, total } = Route.useLoaderData()
  const { page } = Route.useSearch()

  return (
    <div className="library-page">
      <div className="library-header">
        <Button to="/">Library</Button>
        <h1>All cards ({total})</h1>
      </div>
      <div className="library-content">
        {cards.length === 0 ? (
          <p>No cards have been saved yet.</p>
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
                <div className="library-grid-item-footer library-grid-item-footer-stacked">
                  <span>{card.title || 'Untitled'}</span>
                  <div className="library-grid-item-meta">
                    <span>{new Date(card.updatedAt).toLocaleString()}</span>
                    <Link to="/edit/$id" params={{ id: card.editId }}>
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} />
      </div>
    </div>
  )
}
