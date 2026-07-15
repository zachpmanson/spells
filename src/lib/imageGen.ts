import { generateCoverImage as generateCoverImageFn } from '../server/generateCoverImage'
import { uploadImage as uploadImageFn } from '../server/uploadImage'

export interface GenerateImageRequest {
  title: string
  typeLine: string
  rulesText: string
  flavorText: string
  imageModel?: string
  textModel?: string
  style?: string
}

export async function generateCoverImage(req: GenerateImageRequest): Promise<string> {
  const { dataUrl, aiLog } = await generateCoverImageFn({ data: req })
  for (const interaction of aiLog) {
    console.log(`[generateCoverImage] ${interaction.model}\nprompt: ${interaction.prompt}\nresponse: ${interaction.response}`)
  }
  return dataUrl
}

export async function uploadCoverImage(dataUrl: string): Promise<string> {
  const { url } = await uploadImageFn({ data: { dataUrl } })
  return url
}
