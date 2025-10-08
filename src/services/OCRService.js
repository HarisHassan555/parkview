import GeminiService from './GeminiService'

class OCRService {
  static async extractText(file) {
    return await GeminiService.extractText(file)
  }

  static async extractTextFromUrl(imageUrl) {
    return await GeminiService.extractTextFromUrl(imageUrl)
  }
}

export default OCRService
