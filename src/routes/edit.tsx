import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import App from '../App'
import { useCardStore } from '../lib/cardStore'

interface EditSearch {
  id?: string
  title?: string
  manaCost?: string
  typeLine?: string
  rulesText?: string
  flavorText?: string
  powerToughness?: string
  imageUrl?: string
  generateImage?: boolean
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return value === true || value === 'true' || value === '1' ? true : undefined
}

export const Route = createFileRoute('/edit')({
  validateSearch: (search: Record<string, unknown>): EditSearch => ({
    id: asString(search.id),
    title: asString(search.title),
    manaCost: asString(search.manaCost),
    typeLine: asString(search.typeLine),
    rulesText: asString(search.rulesText),
    flavorText: asString(search.flavorText),
    powerToughness: asString(search.powerToughness),
    imageUrl: asString(search.imageUrl),
    generateImage: asBoolean(search.generateImage),
  }),
  component: EditRoute,
})

function EditRoute() {
  const search = Route.useSearch()
  const hydrateFromStorage = useCardStore((s) => s.hydrateFromStorage)
  const loadCardById = useCardStore((s) => s.loadCardById)
  const newCardWithOverrides = useCardStore((s) => s.newCardWithOverrides)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    hydrateFromStorage()

    if (search.id) {
      if (loadCardById(search.id)) return
    }

    const hasFieldOverrides =
      search.title !== undefined ||
      search.manaCost !== undefined ||
      search.typeLine !== undefined ||
      search.rulesText !== undefined ||
      search.flavorText !== undefined ||
      search.powerToughness !== undefined ||
      search.imageUrl !== undefined

    if (hasFieldOverrides) {
      newCardWithOverrides({
        title: search.title,
        manaCost: search.manaCost,
        typeLine: search.typeLine,
        rulesText: search.rulesText,
        flavorText: search.flavorText,
        powerToughness: search.powerToughness,
        coverImage: search.imageUrl
          ? { source: 'url', dataUrl: search.imageUrl, offsetXPct: 50, offsetYPct: 50, scale: 1 }
          : undefined,
      })
    }
    // Only ever apply search-param overrides once, on the initial load of this route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <App autoGenerateImage={search.generateImage} />
}
