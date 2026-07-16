export interface Deck {
  id: string
  publicId: string
  editId: string
  title: string
}

export function createBlankDeck(title: string): Deck {
  return {
    id: crypto.randomUUID(),
    publicId: crypto.randomUUID(),
    editId: crypto.randomUUID(),
    title,
  }
}
