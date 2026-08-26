import { createServerFn } from '@tanstack/react-start'
import { listCardPreviewsForDecks } from './decksDb'

// GET: a public read (deck previews shown on shared/library pages), so it stays
// on the un-authed surface — the edge gates only POST /_serverFn/*.
export const listDeckCardPreviews = createServerFn({ method: 'GET' })
  .validator((data: { deckPublicIds: string[] }) => data)
  .handler(async ({ data }) => {
    return listCardPreviewsForDecks(data.deckPublicIds)
  })
