import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '../../components/Button'
import { listDecks } from '../../server/listDecks'

export const Route = createFileRoute('/admin/decks')({
  loader: () => listDecks(),
  head: () => ({
    meta: [{ title: 'All decks - Spells' }],
  }),
  component: AdminDecksRoute,
})

function AdminDecksRoute() {
  const decks = Route.useLoaderData()

  return (
    <div className="library-page">
      <div className="library-header">
        <Button to="/">Library</Button>
        <h1>All decks ({decks.length})</h1>
      </div>
      <div className="library-content">
        {decks.length === 0 ? (
          <p>No decks have been saved yet.</p>
        ) : (
          <ul className="library-grid">
            {decks.map((deck) => (
              <li key={deck.publicId} className="library-grid-item">
                <Link
                  to="/deck/$id"
                  params={{ id: deck.publicId }}
                  className="library-grid-item-preview"
                  title={`View ${deck.title || 'Untitled deck'}`}
                >
                  <div className="deck-stack-empty">{deck.title || 'Untitled deck'}</div>
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
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
