export interface ImageModelOption {
  id: string
  label: string
}

export const IMAGE_MODELS: ImageModelOption[] = [
  { id: 'bytedance-seed/seedream-4.5', label: 'Seedream 4.5' },
  { id: 'google/gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image' },
]

export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0].id
