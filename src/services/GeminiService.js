class GeminiService {
  static API_KEY = 'AIzaSyBI0M-FLQUpNRw_rgHPb5gS0ZuJ7NXV4bc'
  static API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

  static async extractText(file) {
    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(file)
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract all transaction details from the image and return ONLY a valid JSON object. Do NOT include any markdown formatting (like ```json) or conversational text. The JSON must strictly adhere to this exact structure:\n\n{\n  \"status\": \"<status_of_transaction>\",\n  \"reference_number\": \"<if_present>\",\n  \"date\": \"<date_of_transaction>\",\n  \"time\": \"<time_of_transaction>\",\n  \"amount\": {\n    \"currency\": \"<currency_code>\",\n    \"value\": \"<numeric_amount>\"\n  },\n  \"from\": {\n    \"name\": \"<sender_name>\",\n    \"account_type\": \"<if_present>\",\n    \"account_number\": \"<full_account_number_or_masked_suffix>\"\n  },\n  \"to\": {\n    \"name\": \"<receiver_name>\",\n    \"bank\": \"<if_present>\",\n    \"account_number\": \"<full_account_number_or_masked_suffix>\"\n  },\n  \"purpose_of_transfer\": \"<if_present>\",\n  \"transaction_type\": \"<if_present>\",\n  \"awards\": []\n}\n\nIf a field is not present in the image, omit it from the JSON or set its value to null if it's a mandatory part of a sub-object. Ensure all values are correctly extracted from the image. If an award is found, add it as a string to the awards array."
              },
              {
                inline_data: {
                  mime_type: file.type,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 10
        }
      }

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error.message || 'Gemini API processing failed')
      }

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No text could be extracted from the document')
      }

      const responseText = result.candidates[0].content.parts[0].text
      
      if (!responseText) {
        throw new Error('No readable text found in the document')
      }

      // Clean up the response text by removing markdown code blocks
      let cleanText = responseText
      if (cleanText.includes('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      }

      // Try to parse the JSON
      let structuredData = null
      try {
        structuredData = JSON.parse(cleanText)
      } catch (parseError) {
        console.warn('Failed to parse JSON from Gemini response:', parseError)
        // If JSON parsing fails, return the raw text
        return {
          text: responseText,
          confidence: 95,
          processingTime: 0,
          pages: 1,
          api: 'gemini'
        }
      }

      return {
        text: responseText,
        structuredData: structuredData,
        confidence: 95,
        processingTime: 0,
        pages: 1,
        api: 'gemini'
      }

    } catch (error) {
      console.error('Gemini Service Error:', error)
      throw new Error(`Failed to process document with Gemini: ${error.message}`)
    }
  }

  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // Remove the data URL prefix (data:image/jpeg;base64,)
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  static async extractTextFromUrl(imageUrl) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract all transaction details from the image and return ONLY a valid JSON object. Do NOT include any markdown formatting (like ```json) or conversational text. The JSON must strictly adhere to this exact structure:\n\n{\n  \"status\": \"<status_of_transaction>\",\n  \"reference_number\": \"<if_present>\",\n  \"date\": \"<date_of_transaction>\",\n  \"time\": \"<time_of_transaction>\",\n  \"amount\": {\n    \"currency\": \"<currency_code>\",\n    \"value\": \"<numeric_amount>\"\n  },\n  \"from\": {\n    \"name\": \"<sender_name>\",\n    \"account_type\": \"<if_present>\",\n    \"account_number\": \"<full_account_number_or_masked_suffix>\"\n  },\n  \"to\": {\n    \"name\": \"<receiver_name>\",\n    \"bank\": \"<if_present>\",\n    \"account_number\": \"<full_account_number_or_masked_suffix>\"\n  },\n  \"purpose_of_transfer\": \"<if_present>\",\n  \"transaction_type\": \"<if_present>\",\n  \"awards\": []\n}\n\nIf a field is not present in the image, omit it from the JSON or set its value to null if it's a mandatory part of a sub-object. Ensure all values are correctly extracted from the image. If an award is found, add it as a string to the awards array."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageUrl
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 10
        }
      }

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error.message || 'Gemini API processing failed')
      }

      if (!result.candidates || result.candidates.length === 0) {
        throw new Error('No text could be extracted from the document')
      }

      const responseText = result.candidates[0].content.parts[0].text
      
      if (!responseText) {
        throw new Error('No readable text found in the document')
      }

      // Clean up the response text by removing markdown code blocks
      let cleanText = responseText
      if (cleanText.includes('```json')) {
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      }

      // Try to parse the JSON
      let structuredData = null
      try {
        structuredData = JSON.parse(cleanText)
      } catch (parseError) {
        console.warn('Failed to parse JSON from Gemini response:', parseError)
        // If JSON parsing fails, return the raw text
        return {
          text: responseText,
          confidence: 95,
          processingTime: 0,
          pages: 1,
          api: 'gemini'
        }
      }

      return {
        text: responseText,
        structuredData: structuredData,
        confidence: 95,
        processingTime: 0,
        pages: 1,
        api: 'gemini'
      }

    } catch (error) {
      console.error('Gemini Service Error:', error)
      throw new Error(`Failed to process document with Gemini: ${error.message}`)
    }
  }
}

export default GeminiService