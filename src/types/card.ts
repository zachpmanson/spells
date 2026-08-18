export interface BoxCoords {
  xPct: number
  yPct: number
  widthPct: number
  heightPct: number
}

export interface TemplateLayout {
  id: string
  name: string
  imagePath: string
  aspectRatio: number
  fields: {
    title: BoxCoords
    manaCost: BoxCoords
    typeLine: BoxCoords
    rulesText: BoxCoords
    flavorText?: BoxCoords
    coverImage: BoxCoords
    powerToughness?: BoxCoords
  }
}

export interface CoverImage {
  source: 'upload' | 'generated' | 'url'
  dataUrl: string
  offsetXPct: number
  offsetYPct: number
  scale: number
}

export interface Card {
  id: string
  publicId: string | null
  editId: string
  templateId: string
  title: string
  manaCost: string
  typeLine: string
  rulesText: string
  flavorText: string
  showFlavorText: boolean
  powerToughness: string
  coverImage: CoverImage | null
  // Path to a server-stored PNG of the rendered card, used as the
  // OpenGraph/twitter preview image for shared /card/<uuid> links.
  ogImage?: string | null
  // Raw text dump attached to the card (e.g. the body of a Claude skill) so a
  // shared /card/<uuid> link conveys both the card image and the full text.
  skillBody: string
}

export function createBlankCard(templateId: string): Card {
  return {
    id: crypto.randomUUID(),
    publicId: null,
    editId: crypto.randomUUID(),
    templateId,
    title: '',
    manaCost: '',
    typeLine: '',
    rulesText: '',
    flavorText: '',
    showFlavorText: true,
    powerToughness: '1/1',
    coverImage: null,
    ogImage: null,
    skillBody: '',
  }
}

// Cards persisted before skillBody existed (localStorage library, SQLite rows,
// imported JSON) won't carry the field — fill defaults so consumers can rely on
// it being present without sprinkling `?? ''` everywhere.
export function normalizeCard(card: Omit<Card, 'skillBody'> & { skillBody?: string }): Card {
  return { ...card, skillBody: card.skillBody ?? '' }
}
