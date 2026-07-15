import { createServerFn } from '@tanstack/react-start'
import { OpenRouter } from '@openrouter/sdk'
import { DEFAULT_IMAGE_MODEL } from '../lib/imageModels'
import { DEFAULT_TEXT_MODEL } from '../lib/textModels'
import { getImageStylePhrase } from '../lib/imageStyles'
import { saveImageDataUrl } from './imageStorage'

interface GenerateImageInput {
  title: string
  typeLine: string
  rulesText: string
  flavorText: string
  imageModel?: string
  textModel?: string
  style?: string
}

async function toDataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl
  const res = await fetch(imageUrl)
  const contentType = res.headers.get('content-type') ?? 'image/png'
  const buffer = Buffer.from(await res.arrayBuffer())
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

interface AiInteraction {
  model: string
  prompt: string
  response: string
}

async function describeSymbol(
  openrouter: OpenRouter,
  title: string,
  rulesText: string,
  flavorText: string,
  textModel: string,
  stylePhrase: string,
  log: AiInteraction[],
): Promise<string> {
  const body = [rulesText, flavorText].filter(Boolean).join('\n')
  const prompt = `Here is some text, describe a very basic symbol for the text. The symbol should be a play on words, or a twist, or a joke. The image should not need to contain any words in it, and should be suitable for a ${stylePhrase}. Output only 4 words: \n"${title}\n${body}"\n`

  console.log('[generateCoverImage] symbol prompt ->', textModel, '\n' + prompt)

  const result = await openrouter.chat.send({
    chatRequest: {
      model: textModel,
      messages: [{ role: 'user', content: prompt }],
      modalities: ['text'],
    },
  })

  if (!('choices' in result)) {
    throw new Error('Unexpected streaming response from symbol description model')
  }

  const content = result.choices[0]?.message?.content
  const text = typeof content === 'string' ? content : ''
  const description = text.trim()

  console.log('[generateCoverImage] symbol response <-', description)
  log.push({ model: textModel, prompt, response: description })

  if (!description) {
    throw new Error('No symbol description returned by the model')
  }
  return description
}

export const generateCoverImage = createServerFn({ method: 'POST' })
  .validator((data: GenerateImageInput) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured on the server')
    }

    const aiLog: AiInteraction[] = []
    const openrouter = new OpenRouter({ apiKey })
    const textModel = data.textModel || DEFAULT_TEXT_MODEL
    const stylePhrase = getImageStylePhrase(data.style)
    const symbol = await describeSymbol(openrouter, data.title, data.rulesText, data.flavorText, textModel, stylePhrase, aiLog)
    const imagePrompt = `${symbol}, ${stylePhrase}, no frame or border`
    const imageModel = data.imageModel || DEFAULT_IMAGE_MODEL

    console.log('[generateCoverImage] image prompt ->', imageModel, imagePrompt)

    const result = await openrouter.chat.send({
      chatRequest: {
        model: imageModel,
        messages: [{ role: 'user', content: imagePrompt }],
        modalities: ['image'],
      },
    })

    if (!('choices' in result)) {
      throw new Error('Unexpected streaming response from image generation model')
    }

    const image = result.choices[0]?.message?.images?.[0]
    if (!image) {
      throw new Error('No image returned by the model')
    }

    console.log('[generateCoverImage] image response <- received image, url length', image.imageUrl.url.length)
    aiLog.push({ model: imageModel, prompt: imagePrompt, response: '[image data]' })

    const storedUrl = await saveImageDataUrl(await toDataUrl(image.imageUrl.url))

    return { dataUrl: storedUrl, aiLog }
  })
