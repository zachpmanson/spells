import type { TemplateLayout } from '../types/card'

// Shared field layout, calibrated by eye against the frame images in assets/
// (1005x1407px, standard MTG card proportions). Nudge these once real cards
// are being proofed against a specific frame.
const DEFAULT_FIELDS: TemplateLayout['fields'] = {
  title: { xPct: 9, yPct: 6, widthPct: 62, heightPct: 5.5 },
  manaCost: { xPct: 74, yPct: 6, widthPct: 18, heightPct: 5.5 },
  coverImage: { xPct: 6, yPct: 11, widthPct: 88, heightPct: 45 },
  typeLine: { xPct: 8, yPct: 57.5, widthPct: 84, heightPct: 5 },
  rulesText: { xPct: 8, yPct: 65, widthPct: 84, heightPct: 18 },
  flavorText: { xPct: 8, yPct: 83.5, widthPct: 84, heightPct: 6 },
  powerToughness: { xPct: 79, yPct: 90, widthPct: 15, heightPct: 5.5 },
}

const STANDARD_CARD_ASPECT_RATIO = 1005 / 1407

export const PLACEHOLDER_TEMPLATE: TemplateLayout = {
  id: 'placeholder',
  name: 'Placeholder frame',
  imagePath: '',
  aspectRatio: 750 / 1050,
  fields: DEFAULT_FIELDS,
}

// Every image dropped into the repo-root `assets/` folder becomes a
// selectable template automatically, using the shared default field layout
// above. Rename the file to change the dropdown label.
const assetTemplateImages = import.meta.glob('/assets/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>

function labelFromPath(path: string): string {
  const filename = path.split('/').pop() ?? path
  const base = filename.replace(/\.[^.]+$/, '')
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} frame`
}

const ASSET_TEMPLATES: TemplateLayout[] = Object.entries(assetTemplateImages)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => {
    const id = (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '')
    return {
      id,
      name: labelFromPath(path),
      imagePath: url,
      aspectRatio: STANDARD_CARD_ASPECT_RATIO,
      fields: DEFAULT_FIELDS,
    }
  })

export const TEMPLATES: TemplateLayout[] =
  ASSET_TEMPLATES.length > 0 ? ASSET_TEMPLATES : [PLACEHOLDER_TEMPLATE]

export const DEFAULT_TEMPLATE: TemplateLayout = TEMPLATES[0]

export function getTemplate(id: string): TemplateLayout {
  return TEMPLATES.find((t) => t.id === id) ?? DEFAULT_TEMPLATE
}
