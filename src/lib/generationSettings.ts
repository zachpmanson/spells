import { useEffect, useState } from 'react'
import { DEFAULT_IMAGE_MODEL } from './imageModels'
import { DEFAULT_TEXT_MODEL } from './textModels'
import { DEFAULT_IMAGE_STYLE } from './imageStyles'

const GENERATION_SETTINGS_KEY = 'spells:generationSettings'

export interface GenerationSettings {
  imageModel: string
  textModel: string
  style: string
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function loadGenerationSettings(): GenerationSettings {
  const defaults: GenerationSettings = {
    imageModel: DEFAULT_IMAGE_MODEL,
    textModel: DEFAULT_TEXT_MODEL,
    style: DEFAULT_IMAGE_STYLE,
  }
  if (!isBrowser()) return defaults
  const raw = localStorage.getItem(GENERATION_SETTINGS_KEY)
  if (!raw) return defaults
  try {
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function saveGenerationSettings(settings: GenerationSettings): void {
  if (!isBrowser()) return
  localStorage.setItem(GENERATION_SETTINGS_KEY, JSON.stringify(settings))
}

export function useGenerationSettings() {
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL)
  const [textModel, setTextModel] = useState(DEFAULT_TEXT_MODEL)
  const [style, setStyle] = useState(DEFAULT_IMAGE_STYLE)

  useEffect(() => {
    const settings = loadGenerationSettings()
    setImageModel(settings.imageModel)
    setTextModel(settings.textModel)
    setStyle(settings.style)
  }, [])

  useEffect(() => {
    saveGenerationSettings({ imageModel, textModel, style })
  }, [imageModel, textModel, style])

  return { imageModel, setImageModel, textModel, setTextModel, style, setStyle }
}
