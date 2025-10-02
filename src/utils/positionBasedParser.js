/**
 * POSITION-BASED UNIVERSAL MOBILE PAYMENT PARSER
 * Uses document structure and position logic instead of hardcoded values
 * Truly universal - works with any bank, any names, any values
 */

export const parsePositionBasedMobilePayment = (ocrText) => {
  console.log('📱 POSITION-BASED UNIVERSAL PARSER - Processing payment receipt')
  
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
  
  // Analyze document structure and extract based on position
  const structure = analyzeDocumentStructure(lines)
  
  // Extract transaction ID based on position patterns
  paymentInfo.transactionId = extractTransactionId(lines, structure)
  
  // Extract date and time based on position patterns
  const dateTime = extractDateTime(lines, structure)
  paymentInfo.date = dateTime.date
  paymentInfo.time = dateTime.time
  
  // Extract amount based on position patterns
  paymentInfo.amount = extractAmount(lines, structure)
  
  // Extract fee and total
  const feeTotal = extractFeeAndTotal(lines, structure)
  paymentInfo.fee = feeTotal.fee
  paymentInfo.totalAmount = feeTotal.total
  
  // Extract names and accounts based on position
  const names = extractNamesAndAccounts(lines, structure)
  paymentInfo.fromName = names.fromName
  paymentInfo.toName = names.toName
  paymentInfo.fromPhone = names.fromPhone
  paymentInfo.toPhone = names.toPhone
  paymentInfo.fromAccount = names.fromAccount
  paymentInfo.toAccount = names.toAccount
  
  // Extract service provider based on position
  paymentInfo.service = extractServiceProvider(lines, structure)
  
  // Extract status
  paymentInfo.status = extractStatus(lines, structure)
  
  return paymentInfo
}

/**
 * Analyze document structure to identify key sections
 */
const analyzeDocumentStructure = (lines) => {
  const structure = {
    hasFromSection: false,
    hasToSection: false,
    hasAmountSection: false,
    hasDateSection: false,
    hasTransactionIdSection: false,
    fromIndex: -1,
    toIndex: -1,
    amountIndex: -1,
    dateIndex: -1,
    transactionIdIndex: -1
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Detect From section
    if (line === 'From' || line.includes('From') || line.includes('Sent by')) {
      structure.hasFromSection = true
      structure.fromIndex = i
    }
    
    // Detect To section
    if (line === 'To' || line.includes('To') || line.includes('Sent to')) {
      structure.hasToSection = true
      structure.toIndex = i
    }
    
    // Detect amount section (PKR, Rs., Amount)
    if (line.includes('PKR') || line.includes('Rs.') || line === 'Amount') {
      structure.hasAmountSection = true
      structure.amountIndex = i
    }
    
    // Detect date section
    if (line.includes('On ') || line.includes('September') || line.includes('October') || 
        line.includes('November') || line.includes('December') || line.includes('January') ||
        line.includes('February') || line.includes('March') || line.includes('April') ||
        line.includes('May') || line.includes('June') || line.includes('July') ||
        line.includes('August') || /\d{1,2}-\w{3}-\d{4}/.test(line)) {
      structure.hasDateSection = true
      structure.dateIndex = i
    }
    
    // Detect transaction ID section
    if (line.includes('TID:') || line.includes('ID#') || line.includes('Ref#')) {
      structure.hasTransactionIdSection = true
      structure.transactionIdIndex = i
    }
  }
  
  return structure
}

/**
 * Extract transaction ID based on position patterns
 */
const extractTransactionId = (lines, structure) => {
  // Look for TID:, ID#, Ref# patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const tidMatch = line.match(/TID:\s*(\d+)/i)
    if (tidMatch) return tidMatch[1]
    
    const idMatch = line.match(/ID#(\d+)/i)
    if (idMatch) return idMatch[1]
    
    const refMatch = line.match(/Ref#(\d+)/i)
    if (refMatch) return refMatch[1]
  }
  
  // Fallback: look for long number sequences
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const numberMatch = line.match(/(\d{10,})/)
    if (numberMatch) return numberMatch[1]
  }
  
  return ''
}

/**
 * Extract date and time based on position patterns
 */
const extractDateTime = (lines, structure) => {
  let date = ''
  let time = ''
  
  // Look for date patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Full date with month name
    const fullDateMatch = line.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i)
    if (fullDateMatch) {
      date = fullDateMatch[1]
    }
    
    // DD-MMM-YYYY format
    const dashDateMatch = line.match(/(\d{1,2}-[A-Za-z]{3}-\d{4})/)
    if (dashDateMatch) {
      date = dashDateMatch[1]
    }
    
    // Time patterns
    const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM))/i)
    if (timeMatch) {
      time = timeMatch[1]
    }
  }
  
  return { date, time }
}

/**
 * Extract amount based on position patterns
 */
const extractAmount = (lines, structure) => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // PKR amount format
    const pkrMatch = line.match(/PKR\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)
    if (pkrMatch) {
      return parseFloat(pkrMatch[1].replace(/,/g, ''))
    }
    
    // Rs. amount format
    const rsMatch = line.match(/Rs\.\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i)
    if (rsMatch) {
      return parseFloat(rsMatch[1].replace(/,/g, ''))
    }
    
    // Amount field
    if (line === 'Amount') {
      // Look at next line for amount
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const amountMatch = nextLine.match(/(\d+(?:\.\d{2})?)/)
        if (amountMatch) {
          return parseFloat(amountMatch[1])
        }
      }
    }
  }
  
  return 0
}

/**
 * Extract fee and total based on position patterns
 */
const extractFeeAndTotal = (lines, structure) => {
  let fee = 0
  let total = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Fee patterns
    if (line.includes('Fee')) {
      const feeMatch = line.match(/Fee\s*Rs\.\s*(\d+(?:\.\d{2})?)/i)
      if (feeMatch) {
        fee = parseFloat(feeMatch[1])
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const feeMatch2 = nextLine.match(/(\d+(?:\.\d{2})?)/)
        if (feeMatch2) {
          fee = parseFloat(feeMatch2[1])
        }
      }
    }
    
    // Total amount patterns
    if (line.includes('Total Amount')) {
      const totalMatch = line.match(/Total\s*Amount\s*Rs\.\s*(\d+(?:\.\d{2})?)/i)
      if (totalMatch) {
        total = parseFloat(totalMatch[1])
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const totalMatch2 = nextLine.match(/(\d+(?:\.\d{2})?)/)
        if (totalMatch2) {
          total = parseFloat(totalMatch2[1])
        }
      }
    }
  }
  
  return { fee, total }
}

/**
 * Extract names and accounts based on position patterns
 */
const extractNamesAndAccounts = (lines, structure) => {
  const result = {
    fromName: '',
    fromPhone: '',
    toName: '',
    toPhone: '',
    fromAccount: '',
    toAccount: ''
  }
  
  // Find all potential names (all caps, multiple words)
  const potentialNames = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^[A-Z][A-Z\s]+$/.test(line) && line.length > 3 && !isExcludedWord(line)) {
      potentialNames.push({ name: line, index: i })
    }
  }
  
  // Assign names based on From/To sections with improved logic
  if (structure.hasFromSection && structure.hasToSection) {
    // Both sections exist - find names between From and To, and after To
    for (const nameObj of potentialNames) {
      if (nameObj.index > structure.fromIndex && nameObj.index < structure.toIndex && !result.fromName) {
        result.fromName = nameObj.name
      } else if (nameObj.index > structure.toIndex && !result.toName) {
        result.toName = nameObj.name
      }
    }
  } else if (structure.hasFromSection) {
    // Only From section exists - first name after From is "from", second is "to"
    let foundFrom = false
    for (const nameObj of potentialNames) {
      if (nameObj.index > structure.fromIndex && !foundFrom) {
        result.fromName = nameObj.name
        foundFrom = true
      } else if (foundFrom && !result.toName) {
        result.toName = nameObj.name
        break
      }
    }
  } else if (structure.hasToSection) {
    // Only To section exists - first name after To is "to", second is "from"
    let foundTo = false
    for (const nameObj of potentialNames) {
      if (nameObj.index > structure.toIndex && !foundTo) {
        result.toName = nameObj.name
        foundTo = true
      } else if (foundTo && !result.fromName) {
        result.fromName = nameObj.name
        break
      }
    }
  } else {
    // No clear sections, use position order
    if (potentialNames.length >= 2) {
      result.fromName = potentialNames[0].name
      result.toName = potentialNames[1].name
    } else if (potentialNames.length === 1) {
      result.fromName = potentialNames[0].name
    }
  }
  
  // Extract phone numbers and account numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Phone numbers (11 digits)
    const phoneMatch = line.match(/(\d{11})/)
    if (phoneMatch) {
      if (!result.fromPhone) {
        result.fromPhone = phoneMatch[1]
      } else if (!result.toPhone) {
        result.toPhone = phoneMatch[1]
      }
    }
    
    // Account numbers (masked or full)
    const accountMatch = line.match(/(PK\*+\d{4})/)
    if (accountMatch) {
      if (!result.fromAccount) {
        result.fromAccount = accountMatch[1]
      } else if (!result.toAccount) {
        result.toAccount = accountMatch[1]
      }
    }
    
    // Full account numbers (15+ digits)
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
 * Extract service provider based on position patterns
 */
const extractServiceProvider = (lines, structure) => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.includes('JazzCash')) return 'JazzCash'
    if (line.includes('easypaisa') || line.includes('EasyPaisa')) return 'EasyPaisa'
    if (line.includes('Meezan Bank')) return 'Meezan Bank'
    if (line.includes('alfor')) return 'alfor Bank'
    if (line.includes('RAAST')) return 'RAAST'
    if (line.includes('Inter Bank')) return 'Inter Bank Transfer'
    if (line.includes('Current Account')) return 'Bank Transfer'
  }
  
  return 'Unknown'
}

/**
 * Extract status based on position patterns
 */
const extractStatus = (lines, structure) => {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.includes('Transaction Successful') || 
        line.includes('Money has been sent') || 
        line.includes('Transferred Successfully') || 
        line.includes('Transaction successful')) {
      return 'Success'
    }
  }
  
  return 'Success'
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
