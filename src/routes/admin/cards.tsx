import { createFileRoute, Link } from '@tanstack/react-router'
import { CardPreview } from '../../components/CardPreview'
import { Button } from '../../components/Button'
import { listCards } from '../../server/listCards'

export const Route = createFileRoute('/admin/cards')({
  loader: () => listCards(),
  head: () => ({
    meta: [{ title: 'All cards - Spells' }],
  }),
  component: AdminCardsRoute,
})

function AdminCardsRoute() {
  const cards = Route.useLoaderData()

  return (
    <div className="library-page">
      <div className="library-header">
        <Button to="/">Library</Button>
        <h1>All cards ({cards.length})</h1>
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
                <div className="library-grid-item-footer">
                  <span>{card.title || 'Untitled'}</span>
                  <span>{new Date(card.updatedAt).toLocaleString()}</span>
                  <Link to="/edit/$id" params={{ id: card.id }}>
                    Edit
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
