import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import App from '../../App'
import { useCardStore } from '../../lib/cardStore'
import { getCardForEdit } from '../../server/getCardForEdit'

export const Route = createFileRoute('/edit/$id')({
  loader: ({ params }) => getCardForEdit({ data: { editId: params.id } }),
  head: () => ({
    meta: [{ title: 'Edit - Spells' }],
  }),
  component: EditByIdRoute,
})

function EditByIdRoute() {
  const { id } = Route.useParams()
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCardByEditId = useCardStore((s) => s.loadCardByEditId)
  const loadCardFromServer = useCardStore((s) => s.loadCardFromServer)

  useEffect(() => {
    hydrateFromStorage()
    if (!loadCardByEditId(id)) {
      // Not in this browser's local library — e.g. an edit link opened on a
      // fresh device. Fall back to the server copy keyed by the same editId.
      if (data) {
        loadCardFromServer(data)
      } else {
        navigate({ to: '/', replace: true })
      }
    }
    // Re-run whenever the id in the URL changes so switching cards loads the right one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return <App />
}
