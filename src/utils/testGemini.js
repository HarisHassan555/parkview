// Test utility for Gemini API
import GeminiService from '../services/GeminiService'

// Test function to verify Gemini API is working
export const testGeminiAPI = async () => {
  try {
    console.log('🧪 Testing Gemini API...')
    
    // Create a simple test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, 1, 1)
    
    // Convert canvas to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    const file = new File([blob], 'test.png', { type: 'image/png' })
    
    const result = await GeminiService.extractText(file)
    console.log('✅ Gemini API test successful:', result)
    
    if (result.structuredData) {
      console.log('📊 Structured data extracted:', result.structuredData)
    }
    
    return true
  } catch (error) {
    console.error('❌ Gemini API test failed:', error)
    return false
  }
}

// Export for use in console
window.testGeminiAPI = testGeminiAPI
