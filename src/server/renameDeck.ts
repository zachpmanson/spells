import { createServerFn } from '@tanstack/react-start'
import { getDeckByEditId, renameDeck as renameDeckRow } from './decksDb'

export const renameDeck = createServerFn({ method: 'POST' })
  .validator((data: { editId: string; title: string }) => data)
  .handler(async ({ data }) => {
    const deck = getDeckByEditId(data.editId)
    if (!deck) throw new Error('Deck not found')
    renameDeckRow(data.editId, data.title)
    return { ok: true }
  })
