export interface TextModelOption {
  id: string
  label: string
}

export const TEXT_MODELS: TextModelOption[] = [
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek v4 Flash' },
  { id: 'google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
]

export const DEFAULT_TEXT_MODEL = TEXT_MODELS[0].id
