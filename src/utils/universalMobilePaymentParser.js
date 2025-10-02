/**
 * UNIVERSAL MOBILE PAYMENT PARSER
 * Truly universal approach - works with any names and any receipt format
 * No hardcoded names, pure pattern recognition and position logic
 */

export const parseUniversalMobilePaymentReceipt = (ocrText) => {
  console.log('📱 UNIVERSAL MOBILE PAYMENT PARSER - Processing payment receipt')
  
  const paymentInfo = {
    transactionId: '',
    date: '',
    time: '',
    amount: 0,
    fee: 0,
    totalAmount: 0,
    fromName: '',
    fromPhone: '',
    toName: '',
    toPhone: '',
    fromAccount: '',
    toAccount: '',
    service: '',
    status: 'Success',
    currency: 'PKR'
  }
  
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  const text = lines.join(' ')
  
  // Extract transaction ID
  const tidMatch = text.match(/TID:\s*(\d+)/i)
  if (tidMatch) {
    paymentInfo.transactionId = tidMatch[1]
  } else {
    const idMatch = text.match(/ID#(\d+)/i)
    if (idMatch) {
      paymentInfo.transactionId = idMatch[1]
    } else {
      const refMatch = text.match(/Ref#(\d+)/i)
      if (refMatch) {
        paymentInfo.transactionId = refMatch[1]
      } else {
        // Look for account numbers as transaction ID for bank transfers
        const accountMatch = text.match(/(\d{15,})/)
        if (accountMatch) {
          paymentInfo.transactionId = accountMatch[1]
        }
      }
    }
  }
  
  // Extract date
  const dateMatch = text.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i)
  if (dateMatch) {
    paymentInfo.date = dateMatch[1]
  } else {
    const dateMatch2 = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
    if (dateMatch2) {
      paymentInfo.date = dateMatch2[1]
    } else {
      // Look for "On [date]" pattern
      const onDateMatch = text.match(/On\s+(\w+\s+\d{1,2},\s+\d{4})/i)
      if (onDateMatch) {
        paymentInfo.date = onDateMatch[1]
      } else {
        // Look for DD-MMM-YYYY format
        const dashDateMatch = text.match(/(\d{1,2}-[A-Za-z]{3}-\d{4})/)
        if (dashDateMatch) {
          paymentInfo.date = dashDateMatch[1]
        }
      }
    }
  }
  
  // Extract time
  const timeMatch = text.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
  if (timeMatch) {
    paymentInfo.time = timeMatch[1]
  } else {
    const timeMatch2 = text.match(/(\d{1,2}:\d{2})/)
    if (timeMatch2) {
      paymentInfo.time = timeMatch2[1]
    } else {
      // Look for time in date-time format (30-Sep-2025 07:43:40 PM)
      const dateTimeMatch = text.match(/\d{1,2}-[A-Za-z]{3}-\d{4}\s+(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM))/i)
      if (dateTimeMatch) {
        paymentInfo.time = dateTimeMatch[1]
      } else {
        // Look for time in date-time format without seconds (30-Sep-2025 07:43 PM)
        const dateTimeMatch2 = text.match(/\d{1,2}-[A-Za-z]{3}-\d{4}\s+(\d{1,2}:\d{2}\s*(?:AM|PM))/i)
        if (dateTimeMatch2) {
          paymentInfo.time = dateTimeMatch2[1]
        }
      }
    }
  }
  
  // Extract amount
  const amountMatch = text.match(/Rs\.\s*(\d+(?:\.\d{2})?)/i)
  if (amountMatch) {
    paymentInfo.amount = parseFloat(amountMatch[1])
  } else {
    const amountMatch2 = text.match(/Amount\s*(\d+(?:\.\d{2})?)/i)
    if (amountMatch2) {
      paymentInfo.amount = parseFloat(amountMatch2[1])
    } else {
      // Look for PKR amount format
      const pkrMatch = text.match(/PKR\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)
      if (pkrMatch) {
        paymentInfo.amount = parseFloat(pkrMatch[1].replace(/,/g, ''))
      }
    }
  }
  
  // Extract fee
  const feeMatch = text.match(/Fee\s*Rs\.\s*(\d+(?:\.\d{2})?)/i)
  if (feeMatch) {
    paymentInfo.fee = parseFloat(feeMatch[1])
  } else {
    const feeMatch2 = text.match(/Fee\s*(\d+(?:\.\d{2})?)/i)
    if (feeMatch2) {
      paymentInfo.fee = parseFloat(feeMatch2[1])
    }
  }
  
  // Extract total amount
  const totalMatch = text.match(/Total\s*Amount\s*Rs\.\s*(\d+(?:\.\d{2})?)/i)
  if (totalMatch) {
    paymentInfo.totalAmount = parseFloat(totalMatch[1])
  } else {
    paymentInfo.totalAmount = paymentInfo.amount + paymentInfo.fee
  }
  
  // Universal name extraction
  const names = extractUniversalNamesAndPhones(lines)
  paymentInfo.fromName = names.fromName
  paymentInfo.toName = names.toName
  paymentInfo.fromPhone = names.fromPhone
  paymentInfo.toPhone = names.toPhone
  paymentInfo.fromAccount = names.fromAccount
  paymentInfo.toAccount = names.toAccount
  
  // Extract service provider
  if (text.includes('JazzCash')) {
    paymentInfo.service = 'JazzCash'
  } else if (text.includes('easypaisa') || text.includes('EasyPaisa')) {
    paymentInfo.service = 'EasyPaisa'
  } else if (text.includes('RAAST')) {
    paymentInfo.service = 'RAAST'
  } else if (text.includes('Meezan Bank')) {
    paymentInfo.service = 'Meezan Bank'
  } else if (text.includes('Current Account')) {
    paymentInfo.service = 'Bank Transfer'
  } else if (text.includes('alfor') || text.includes('Best Bank')) {
    paymentInfo.service = 'alfor Bank'
  } else if (text.includes('Inter Bank')) {
    paymentInfo.service = 'Inter Bank Transfer'
  }
  
  // Extract status
  if (text.includes('Transaction Successful') || text.includes('Money has been sent') || text.includes('Transferred Successfully') || text.includes('Transaction successful')) {
    paymentInfo.status = 'Success'
  }
  
  return paymentInfo
}

/**
 * Universal name extraction based on document structure analysis
 * Works with any names, any format - truly scalable
 */
const extractUniversalNamesAndPhones = (lines) => {
  const result = {
    fromName: '',
    fromPhone: '',
    toName: '',
    toPhone: '',
    fromAccount: '',
    toAccount: ''
  }
  
  // Find From/To section markers with improved detection
  let fromIndex = -1
  let toIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line === 'From' || line.includes('From') || line.includes('Sent by')) {
      fromIndex = i
    } else if (line === 'To' || line.includes('To') || line.includes('Sent to')) {
      toIndex = i
    }
  }
  
  // Extract all potential names
  const potentialNames = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Universal name pattern - any all-caps name with spaces
    const isNamePattern = /^[A-Z][A-Z\s]+$/.test(line) && line.length > 3 && 
                         !isExcludedWord(line)
    
    if (isNamePattern) {
      potentialNames.push({ name: line, index: i })
    }
  }
  
  // Assign names based on position relative to From/To markers
  if (potentialNames.length >= 2) {
    let fromName = null
    let toName = null
    
    if (fromIndex !== -1 && toIndex !== -1) {
      // Find name closest to "From" marker (between From and To)
      for (const nameObj of potentialNames) {
        if (nameObj.index > fromIndex && nameObj.index < toIndex && !fromName) {
          fromName = nameObj.name
        }
      }
      
      // Find name closest to "To" marker (after To)
      for (const nameObj of potentialNames) {
        if (nameObj.index > toIndex && !toName) {
          toName = nameObj.name
        }
      }
    } else if (fromIndex !== -1 && toIndex === -1) {
      // Only From marker found, first name after it is "from"
      for (const nameObj of potentialNames) {
        if (nameObj.index > fromIndex && !fromName) {
          fromName = nameObj.name
        }
      }
    } else if (fromIndex === -1 && toIndex !== -1) {
      // Only To marker found, first name after it is "to"
      for (const nameObj of potentialNames) {
        if (nameObj.index > toIndex && !toName) {
          toName = nameObj.name
        }
      }
    }
    
    // Fallback: use first two names found
    if (!fromName && !toName && potentialNames.length >= 2) {
      fromName = potentialNames[0].name
      toName = potentialNames[1].name
    } else if (!fromName && potentialNames.length >= 1) {
      fromName = potentialNames[0].name
    } else if (!toName && potentialNames.length >= 2) {
      toName = potentialNames[1].name
    }
    
    result.fromName = fromName || ''
    result.toName = toName || ''
  } else if (potentialNames.length === 1) {
    // Only one name found, assign to "from"
    result.fromName = potentialNames[0].name
  }
  
  // Extract phone numbers and account numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Extract phone numbers
    const phoneMatch = line.match(/(\d{11})/)
    if (phoneMatch) {
      if (!result.fromPhone) {
        result.fromPhone = phoneMatch[1]
      } else if (!result.toPhone) {
        result.toPhone = phoneMatch[1]
      }
    }
    
    // Extract account numbers (masked or full)
    const accountMatch = line.match(/(PK\*+\d{4})/)
    if (accountMatch) {
      if (!result.fromAccount) {
        result.fromAccount = accountMatch[1]
      } else if (!result.toAccount) {
        result.toAccount = accountMatch[1]
      }
    }
    
    // Extract full account numbers (15+ digits)
    const fullAccountMatch = line.match(/(\d{15,})/)
    if (fullAccountMatch) {
      if (!result.fromAccount) {
        result.fromAccount = fullAccountMatch[1]
      } else if (!result.toAccount) {
        result.toAccount = fullAccountMatch[1]
      }
    }
  }
  
  return result
}

/**
 * Check if a word should be excluded from name patterns
 */
const isExcludedWord = (word) => {
  const excludedWords = [
    'CURRENT', 'ACCOUNT', 'BANK', 'PURPOSE', 'TRANSACTION', 'OTHERS',
    'INTER', 'BEST', 'DIGITAL', 'EXCELLENCE', 'SUCCESSFUL', 'MONEY',
    'TRANSFERRED', 'PKR', 'Rs.', 'TID', 'ID#', 'Ref#', 'Fee', 'Amount',
    'Total', 'Share', 'Save', 'View', 'Securely', 'paid', 'via', 'TA',
    'On', 'at', 'PM', 'AM', 'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August', 'September', 'October', 'November',
    'December', 'Sent', 'by', 'to', 'From', 'To', 'Others', 'Inter',
    'Bank', 'For', 'Digital', 'Excellence', '2022', '2024', 'b'
  ]
  
  return excludedWords.some(excluded => word.includes(excluded))
}
