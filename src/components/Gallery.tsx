import { useNavigate } from '@tanstack/react-router'
import { useCardStore } from '../lib/cardStore'

export function Gallery() {
  const navigate = useNavigate()
  const library = useCardStore((s) => s.library)
  const deleteFromLibrary = useCardStore((s) => s.deleteFromLibrary)

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>My cards</h1>
        <button type="button" className="btn" onClick={() => navigate({ to: '/edit' })}>
          New card
        </button>
      </div>
      <div className="library-content">
        {library.length === 0 ? (
          <p>No saved cards yet.</p>
        ) : (
          <ul className="gallery-list">
            {library.map((card) => (
              <li key={card.id}>
                <span>{card.title || 'Untitled'}</span>
                <div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => navigate({ to: '/edit', search: { id: card.id } })}
                  >
                    Open
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => deleteFromLibrary(card.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
