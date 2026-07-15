export interface ImageStyleOption {
  id: string
  label: string
  promptPhrase: string
}

export const IMAGE_STYLES: ImageStyleOption[] = [
  { id: 'oil-painting', label: 'Oil painting', promptPhrase: 'oil painting' },
  { id: 'stock-image', label: 'Stock image', promptPhrase: 'stock image' },
  { id: 'photorealistic', label: 'Nature photography', promptPhrase: 'nature photography' },
]

export const DEFAULT_IMAGE_STYLE = IMAGE_STYLES[0].id

export function getImageStylePhrase(id: string | undefined): string {
  return IMAGE_STYLES.find((s) => s.id === id)?.promptPhrase ?? IMAGE_STYLES[0].promptPhrase
}
