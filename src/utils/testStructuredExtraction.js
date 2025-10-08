// Test utility for structured data extraction from raw text
export const testStructuredExtraction = () => {
  const sampleRawText = `Transaction successful
Ref#530026036841
30-Sep-2025 11:58:42 PM

PKR 1
--------------------------------
From	MUHAMMAD HARIS HASSAN
**********6197
To	ZAINAB HASSAN
*******2344
Purpose of transfer	Others
Transaction type	Inter Bank`

  // Test the extraction logic
  const extractFromRawText = (text) => {
    // Extract transaction ID
    const refMatch = text.match(/Ref#(\d+)/i)
    const transactionId = refMatch ? refMatch[1] : null
    
    // Extract date and time
    const dateTimeMatch = text.match(/(\d{2}-\w{3}-\d{4})\s+(\d{2}:\d{2}:\d{2}\s+[AP]M)/i)
    const date = dateTimeMatch ? dateTimeMatch[1] : null
    const time = dateTimeMatch ? dateTimeMatch[2] : null
    
    // Extract amount and currency
    const amountMatch = text.match(/(\w{3})\s+(\d+(?:\.\d+)?)/i)
    const currency = amountMatch ? amountMatch[1] : 'PKR'
    const amount = amountMatch ? parseFloat(amountMatch[2]) : null
    
    // Extract sender and receiver
    const fromMatch = text.match(/From\s+(.+?)\s+\*+/i)
    const toMatch = text.match(/To\s+(.+?)\s+\*+/i)
    const senderName = fromMatch ? fromMatch[1].trim() : null
    const receiverName = toMatch ? toMatch[1].trim() : null
    
    // Extract account numbers
    const senderIdMatch = text.match(/From\s+.+?\s+(\*+)/i)
    const receiverIdMatch = text.match(/To\s+.+?\s+(\*+)/i)
    const senderId = senderIdMatch ? senderIdMatch[1] : null
    const receiverId = receiverIdMatch ? receiverIdMatch[1] : null
    
    // Determine transaction type
    const transactionType = text.toLowerCase().includes('inter bank') ? 'bank_transfer' : 
                           text.toLowerCase().includes('jazzcash') || text.toLowerCase().includes('easypaisa') ? 'mobile_payment' : 'other'
    
    // Extract service
    const serviceMatch = text.match(/Transaction type\s+(.+)/i)
    const service = serviceMatch ? serviceMatch[1].trim() : null
    
    // Extract status
    const statusMatch = text.match(/Transaction\s+(successful|failed|pending)/i)
    const status = statusMatch ? statusMatch[1].toLowerCase() : 'successful'
    
    return {
      transaction_type: transactionType,
      sender: {
        name: senderName,
        id: senderId,
        phone: null
      },
      receiver: {
        name: receiverName,
        id: receiverId,
        phone: null
      },
      amount: {
        value: amount,
        currency: currency
      },
      transaction_details: {
        date: date,
        time: time,
        transaction_id: transactionId,
        service: service,
        status: status
      },
      raw_text: text
    }
  }

  const result = extractFromRawText(sampleRawText)
  
  console.log('🧪 Testing structured extraction with sample data:')
  console.log('📊 Extracted structured data:', JSON.stringify(result, null, 2))
  
  // Verify key fields
  const checks = [
    { field: 'transaction_type', expected: 'bank_transfer', actual: result.transaction_type },
    { field: 'sender.name', expected: 'MUHAMMAD HARIS HASSAN', actual: result.sender.name },
    { field: 'receiver.name', expected: 'ZAINAB HASSAN', actual: result.receiver.name },
    { field: 'amount.value', expected: 1, actual: result.amount.value },
    { field: 'amount.currency', expected: 'PKR', actual: result.amount.currency },
    { field: 'transaction_details.transaction_id', expected: '530026036841', actual: result.transaction_details.transaction_id },
    { field: 'transaction_details.date', expected: '30-Sep-2025', actual: result.transaction_details.date },
    { field: 'transaction_details.time', expected: '11:58:42 PM', actual: result.transaction_details.time }
  ]
  
  console.log('\n✅ Validation Results:')
  checks.forEach(check => {
    const passed = check.actual === check.expected
    console.log(`${passed ? '✅' : '❌'} ${check.field}: ${passed ? 'PASS' : 'FAIL'} (expected: ${check.expected}, got: ${check.actual})`)
  })
  
  const allPassed = checks.every(check => check.actual === check.expected)
  console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`)
  
  return result
}

// Export for use in console
window.testStructuredExtraction = testStructuredExtraction
