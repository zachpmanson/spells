import { createServerFn } from '@tanstack/react-start'
import { listCardPreviewsForDecks } from './decksDb'

export const listDeckCardPreviews = createServerFn({ method: 'POST' })
  .validator((data: { deckPublicIds: string[] }) => data)
  .handler(async ({ data }) => {
    return listCardPreviewsForDecks(data.deckPublicIds)
  })
