import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Gallery } from '../components/Gallery'
import { useCardStore } from '../lib/cardStore'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Library - Spells' }],
  }),
  component: LibraryRoute,
})

function LibraryRoute() {
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)

  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  return <Gallery />
}
