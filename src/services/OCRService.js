class OCRService {
  static API_KEY = 'K89756115288957' // Your free OCR API key
  static API_URL = 'https://api.ocr.space/parse/image'
  static isTableMode = false // Toggle for testing

  static async extractText(file) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', 'eng')
      formData.append('isOverlayRequired', 'false')
      formData.append('OCREngine', '2') // Use Engine 2 for better text recognition
      formData.append('detectOrientation', 'true')
      formData.append('scale', 'true')
      formData.append('isTable', this.isTableMode.toString()) // Dynamic table detection
      formData.append('filetype', file.type === 'application/pdf' ? 'PDF' : 'PNG')

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'apikey': this.API_KEY
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || 'OCR processing failed')
      }

      if (!result.ParsedResults || result.ParsedResults.length === 0) {
        throw new Error('No text could be extracted from the document')
      }

      // Extract text from all pages
      const extractedText = result.ParsedResults
        .map(page => page.ParsedText)
        .join('\n\n')
        .trim()

      if (!extractedText) {
        throw new Error('No readable text found in the document')
      }

      return {
        text: extractedText,
        confidence: this.calculateConfidence(result.ParsedResults),
        processingTime: result.ProcessingTimeInMilliseconds,
        pages: result.ParsedResults.length
      }

    } catch (error) {
      console.error('OCR Service Error:', error)
      throw new Error(`Failed to process document: ${error.message}`)
    }
  }

  static calculateConfidence(parsedResults) {
    // Simple confidence calculation based on successful parsing
    const successfulPages = parsedResults.filter(page => 
      page.FileParseExitCode === 1
    ).length
    
    return Math.round((successfulPages / parsedResults.length) * 100)
  }

  static setTableMode(enabled) {
    this.isTableMode = enabled
    console.log(`🔧 OCR Table Mode: ${enabled ? 'ENABLED' : 'DISABLED'}`)
  }

  static async extractTextFromUrl(imageUrl) {
    try {
      const params = new URLSearchParams({
        url: imageUrl,
        language: 'eng',
        isOverlayRequired: 'false',
        OCREngine: '2',
        detectOrientation: 'true',
        scale: 'true'
      })

      const response = await fetch(`${this.API_URL}?${params}`, {
        method: 'GET',
        headers: {
          'apikey': this.API_KEY
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || 'OCR processing failed')
      }

      if (!result.ParsedResults || result.ParsedResults.length === 0) {
        throw new Error('No text could be extracted from the document')
      }

      const extractedText = result.ParsedResults
        .map(page => page.ParsedText)
        .join('\n\n')
        .trim()

      return {
        text: extractedText,
        confidence: this.calculateConfidence(result.ParsedResults),
        processingTime: result.ProcessingTimeInMilliseconds,
        pages: result.ParsedResults.length
      }

    } catch (error) {
      console.error('OCR Service Error:', error)
      throw new Error(`Failed to process document: ${error.message}`)
    }
  }
}

export default OCRService
