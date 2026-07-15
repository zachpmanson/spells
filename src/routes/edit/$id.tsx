import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import App from '../../App'
import { useCardStore } from '../../lib/cardStore'

export const Route = createFileRoute('/edit/$id')({
  component: EditByIdRoute,
})

function EditByIdRoute() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCardById = useCardStore((s) => s.loadCardById)

  useEffect(() => {
    hydrateFromStorage()
    if (!loadCardById(id)) {
      navigate({ to: '/card/$id', params: { id }, replace: true })
    }
    // Re-run whenever the id in the URL changes so switching cards loads the right one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return <App />
}
