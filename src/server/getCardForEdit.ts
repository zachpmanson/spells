import { createServerFn } from '@tanstack/react-start'
import { getSavedCardByEditId } from './cardsDb'

export const getCardForEdit = createServerFn({ method: 'GET' })
  .validator((data: { editId: string }) => data)
  .handler(async ({ data }) => {
    return getSavedCardByEditId(data.editId)
  })
