export interface Deck {
  id: string
  publicId: string
  editId: string
  title: string
  // Path to a server-stored PNG of a deck cover, used as the OpenGraph/twitter
  // preview image for shared /deck/<uuid> links (mirrors Card.ogImage).
  ogImage?: string | null
}

export function createBlankDeck(title: string): Deck {
  return {
    id: crypto.randomUUID(),
    publicId: crypto.randomUUID(),
    editId: crypto.randomUUID(),
    title,
    ogImage: null,
  }
}
