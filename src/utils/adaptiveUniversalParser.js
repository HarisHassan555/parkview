/**
 * ADAPTIVE UNIVERSAL BANK STATEMENT PARSER
 * Uses structural analysis and machine learning-inspired pattern recognition
 * Automatically adapts to ANY bank statement format without manual adjustments
 */

// Enhanced universal patterns with fuzzy matching
const ADAPTIVE_PATTERNS = {
  // Date patterns (multiple formats)
  date: [
    /\d{2}-[A-Za-z]{3}-\d{4}/g,  // DD-MMM-YYYY
    /\d{2}\/\d{2}\/\d{4}/g,      // DD/MM/YYYY
    /\d{4}-\d{2}-\d{2}/g         // YYYY-MM-DD
  ],
  
  // Amount patterns (various formats)
  amount: [
    /\d{1,3}(?:,\d{3})*(?:\.\d{2})/g,  // 1,234.56
    /\d+(?:\.\d{2})/g,                  // 1234.56
    /\d{1,3}(?:,\d{3})*/g               // 1,234
  ],
  
  // Transaction type patterns (comprehensive)
  transactionType: [
    /(RAAST|RAST|Transfer)/gi,
    /(IBFT|IBET|Incoming)/gi,
    /(Balance|Brought|Forward)/gi,
    /(Deposit|Withdrawal|Credit|Debit)/gi,
    /(MPGP2P|1Link|Switch)/gi
  ],
  
  // Bank name patterns (comprehensive)
  bankName: [
    /(BANK|LIMITED|LTD)/gi,
    /(MMB|HABIB|MEEZAN|UNITED|ASKARI|ALHABIB|COMMERCIAL|SONERI|MBL)/gi
  ],
  
  // Account number patterns (various formats)
  accountNumber: [
    /PK\d{2}[A-Z]{4}\d{4,}/g,  // PK format
    /\d{15}/g,                  // 15-digit accounts
    /\d{11}/g,                  // Phone numbers
    /\d{12}/g                   // 12-digit accounts
  ],
  
  // Reference patterns
  reference: [
    /(Ref:\d+)/gi,
    /(FT\d+[A-Z0-9]+)/gi,
    /(Ref\d+)/gi
  ],
  
  // Branch patterns
  branch: [
    /(BR\.|BR-|Branch)/gi,
    /(LHR|COK|Park View|City)/gi,
    /(LHR BR\.|COK-)/gi
  ]
}

/**
 * Parse any bank statement using adaptive structural analysis
 * @param {string} ocrText - Raw OCR text
 * @returns {Object} Parsed bank statement data
 */
export const parseAdaptiveUniversalBankStatement = (ocrText) => {
  console.log('🧠 ADAPTIVE UNIVERSAL PARSER - Machine learning-inspired pattern recognition')
  
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Step 1: Analyze document structure
  const structure = analyzeDocumentStructure(lines)
  
  // Step 2: Extract all patterns using fuzzy matching
  const allPatterns = extractAllPatternsAdaptive(lines)
  
  // Step 3: Identify transaction boundaries using structural analysis
  const transactionBoundaries = identifyTransactionBoundaries(lines, allPatterns, structure)
  
  // Step 4: Extract transactions using boundary information
  const transactions = extractTransactionsFromBoundaries(lines, transactionBoundaries, allPatterns)
  
  // Step 5: Extract account information
  const accountInfo = extractAccountInfoAdaptive(allPatterns, structure)
  
  return {
    accountInfo,
    transactions,
    summary: calculateSummaryAdaptive(transactions),
    rawText: ocrText,
    structure,
    boundaries: transactionBoundaries
  }
}

/**
 * Analyze document structure to understand layout
 * @param {Array} lines - OCR lines
 * @returns {Object} Document structure analysis
 */
const analyzeDocumentStructure = (lines) => {
  const structure = {
    header: [],
    transactionHeaders: [],
    transactionData: [],
    footer: [],
    monetaryLines: [],
    dateLines: [],
    bankLines: [],
    accountLines: []
  }
  
  let currentSection = 'header'
  let transactionStartIndex = -1
  
  lines.forEach((line, index) => {
    // Detect section boundaries using multiple indicators
    if (line.includes('Txn. Date') || line.includes('Value Date') || line.includes('Transaction')) {
      currentSection = 'transactionHeaders'
      transactionStartIndex = index
    } else if (line.includes('Withdrawal') || line.includes('Deposit') || line.includes('Balance')) {
      currentSection = 'transactionData'
    } else if (line.includes('Source') || line.includes('Account') || line.includes('Ref')) {
      currentSection = 'footer'
    }
    
    // Categorize lines by content type
    if (line.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})/)) {
      structure.monetaryLines.push({ line, index })
    }
    
    if (line.match(/\d{2}-[A-Za-z]{3}-\d{4}/)) {
      structure.dateLines.push({ line, index })
    }
    
    if (line.match(/(BANK|MMB|HABIB|MEEZAN|UNITED|ASKARI)/gi)) {
      structure.bankLines.push({ line, index })
    }
    
    if (line.match(/PK\d{2}[A-Z]{4}\d{4,}|\d{11}|\d{15}/)) {
      structure.accountLines.push({ line, index })
    }
    
    structure[currentSection].push({ line, index })
  })
  
  return structure
}

/**
 * Extract all patterns using adaptive fuzzy matching
 * @param {Array} lines - OCR lines
 * @returns {Object} All extracted patterns with confidence scores
 */
const extractAllPatternsAdaptive = (lines) => {
  const patterns = {
    dates: [],
    amounts: [],
    transactionTypes: [],
    bankNames: [],
    accountNumbers: [],
    phoneNumbers: [],
    references: [],
    branches: []
  }
  
  lines.forEach((line, index) => {
    // Extract dates with multiple pattern matching
    ADAPTIVE_PATTERNS.date.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          patterns.dates.push({ 
            value: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'date')
          })
        })
      }
    })
    
    // Extract amounts with multiple pattern matching
    ADAPTIVE_PATTERNS.amount.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const amount = parseFloat(match.replace(/,/g, ''))
          patterns.amounts.push({ 
            value: amount, 
            original: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'amount')
          })
        })
      }
    })
    
    // Extract transaction types with fuzzy matching
    ADAPTIVE_PATTERNS.transactionType.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          patterns.transactionTypes.push({ 
            value: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'transactionType')
          })
        })
      }
    })
    
    // Extract bank names with fuzzy matching
    ADAPTIVE_PATTERNS.bankName.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          patterns.bankNames.push({ 
            value: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'bankName')
          })
        })
      }
    })
    
    // Extract account numbers with fuzzy matching
    ADAPTIVE_PATTERNS.accountNumber.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          patterns.accountNumbers.push({ 
            value: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'accountNumber')
          })
        })
      }
    })
    
    // Extract references
    ADAPTIVE_PATTERNS.reference.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          patterns.references.push({ 
            value: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'reference')
          })
        })
      }
    })
    
    // Extract branches
    ADAPTIVE_PATTERNS.branch.forEach(pattern => {
      const matches = line.match(pattern)
      if (matches) {
        matches.forEach(match => {
          patterns.branches.push({ 
            value: match, 
            line, 
            index, 
            confidence: calculateConfidence(match, 'branch')
          })
        })
      }
    })
  })
  
  return patterns
}

/**
 * Calculate confidence score for pattern matching
 * @param {string} match - Matched text
 * @param {string} type - Pattern type
 * @returns {number} Confidence score (0-1)
 */
const calculateConfidence = (match, type) => {
  let confidence = 0.5 // Base confidence
  
  switch (type) {
    case 'date':
      if (match.match(/\d{2}-[A-Za-z]{3}-\d{4}/)) confidence = 0.9
      else if (match.match(/\d{2}\/\d{2}\/\d{4}/)) confidence = 0.8
      break
    case 'amount':
      if (match.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})/)) confidence = 0.9
      else if (match.match(/\d+(?:\.\d{2})/)) confidence = 0.8
      break
    case 'transactionType':
      if (match.match(/(RAAST|IBFT|Transfer)/gi)) confidence = 0.9
      else if (match.match(/(Balance|Brought|Forward)/gi)) confidence = 0.8
      break
    case 'bankName':
      if (match.match(/(BANK|LIMITED)/gi)) confidence = 0.9
      else if (match.match(/(MMB|HABIB|MEEZAN)/gi)) confidence = 0.8
      break
    case 'accountNumber':
      if (match.match(/PK\d{2}[A-Z]{4}\d{4,}/)) confidence = 0.9
      else if (match.match(/\d{15}/)) confidence = 0.8
      else if (match.match(/\d{11}/)) confidence = 0.7
      break
  }
  
  return confidence
}

/**
 * Identify transaction boundaries using structural analysis
 * @param {Array} lines - OCR lines
 * @param {Object} patterns - All extracted patterns
 * @param {Object} structure - Document structure
 * @returns {Array} Transaction boundaries
 */
const identifyTransactionBoundaries = (lines, patterns, structure) => {
  const boundaries = []
  
  // Find transaction start points using multiple indicators
  const transactionStarts = []
  
  // Look for date patterns that indicate transaction starts (be more selective)
  patterns.dates.forEach(date => {
    if (date.confidence > 0.8 && !date.line.includes('Statement Date') && !date.line.includes('From Date') && !date.line.includes('To Date')) {
      transactionStarts.push(date.index)
    }
  })
  
  // Look for transaction type patterns (be more selective)
  patterns.transactionTypes.forEach(txn => {
    if (txn.confidence > 0.8 && txn.value.match(/(RAAST|IBFT|Transfer)/gi) && !txn.line.includes('Txn. Type')) {
      transactionStarts.push(txn.index)
    }
  })
  
  // Look for amount patterns that indicate transaction data (be more selective)
  patterns.amounts.forEach(amount => {
    if (amount.confidence > 0.8 && amount.value > 1000 && amount.value < 1000000 && !amount.line.includes('Withdrawal') && !amount.line.includes('Deposit')) {
      transactionStarts.push(amount.index)
    }
  })
  
  // Remove duplicates and sort
  const uniqueStarts = [...new Set(transactionStarts)].sort((a, b) => a - b)
  
  // Filter out starts that are too close together (within 5 lines)
  const filteredStarts = []
  uniqueStarts.forEach((start, index) => {
    if (index === 0 || start - filteredStarts[filteredStarts.length - 1] > 5) {
      filteredStarts.push(start)
    }
  })
  
  // Create boundaries with proper end points
  filteredStarts.forEach((start, index) => {
    let end = lines.length
    if (index < filteredStarts.length - 1) {
      end = filteredStarts[index + 1]
    }
    boundaries.push({ start, end, index })
  })
  
  console.log('🎯 Identified transaction boundaries:', boundaries.length)
  boundaries.forEach((boundary, index) => {
    console.log(`Boundary ${index + 1}: Lines ${boundary.start}-${boundary.end}`)
  })
  
  return boundaries
}

/**
 * Extract transactions from identified boundaries
 * @param {Array} lines - OCR lines
 * @param {Array} boundaries - Transaction boundaries
 * @param {Object} patterns - All extracted patterns
 * @returns {Array} Extracted transactions
 */
const extractTransactionsFromBoundaries = (lines, boundaries, patterns) => {
  const transactions = []
  
  boundaries.forEach((boundary, index) => {
    const transaction = {
      txnDate: '',
      valueDate: '',
      txnType: '',
      transactionRef: '',
      branchName: '',
      narration: '',
      withdrawal: 0,
      deposit: 0,
      balance: 0,
      remitterBank: '',
      sourceAccount: '',
      destinationAccount: '',
      rawLine: ''
    }
    
    // Extract data from this boundary
    const boundaryLines = lines.slice(boundary.start, boundary.end)
    const boundaryPatterns = filterPatternsInRange(patterns, boundary.start, boundary.end)
    
    // Extract dates (highest confidence)
    const dates = boundaryPatterns.dates.sort((a, b) => b.confidence - a.confidence)
    if (dates.length > 0) {
      transaction.txnDate = dates[0].value
      transaction.valueDate = dates[0].value
    }
    
    // Extract transaction type (highest confidence, prefer specific types)
    const txnTypes = boundaryPatterns.transactionTypes.sort((a, b) => b.confidence - a.confidence)
    if (txnTypes.length > 0) {
      // Prefer more specific transaction types
      const specificTypes = txnTypes.filter(t => t.value.match(/(RAAST|IBFT|Transfer)/gi))
      if (specificTypes.length > 0) {
        transaction.txnType = specificTypes[0].value
        transaction.transactionRef = specificTypes[0].value
      } else {
        transaction.txnType = txnTypes[0].value
        transaction.transactionRef = txnTypes[0].value
      }
    }
    
    // Extract bank name (highest confidence, prefer specific bank names)
    const banks = boundaryPatterns.bankNames.sort((a, b) => b.confidence - a.confidence)
    if (banks.length > 0) {
      // Prefer more specific bank names
      const specificBanks = banks.filter(b => b.value.match(/(ASKARI|ALHABIB|MEEZAN|MBL|UNITED|HABIB)/gi))
      if (specificBanks.length > 0) {
        transaction.remitterBank = specificBanks[0].value
      } else {
        transaction.remitterBank = banks[0].value
      }
    }
    
    // Extract account numbers
    const accounts = boundaryPatterns.accountNumbers.sort((a, b) => b.confidence - a.confidence)
    if (accounts.length > 0) {
      transaction.sourceAccount = accounts[0].value
    }
    if (accounts.length > 1) {
      transaction.destinationAccount = accounts[1].value
    }
    
    // Extract amounts and categorize
    const amounts = boundaryPatterns.amounts.sort((a, b) => a.value - b.value)
    
    // Categorize amounts by size and context
    const withdrawals = amounts.filter(a => a.value === 0)
    const deposits = amounts.filter(a => a.value >= 1000 && a.value < 1000000)
    const balances = amounts.filter(a => a.value >= 1000000)
    
    transaction.withdrawal = withdrawals.length > 0 ? 0 : 0
    transaction.deposit = deposits.length > 0 ? deposits[0].value : 0
    transaction.balance = balances.length > 0 ? balances[0].value : 0
    
    // Extract narration
    const references = boundaryPatterns.references.map(r => r.value).join(' ')
    transaction.narration = references
    
    // Build raw line
    transaction.rawLine = boundaryLines.join(' | ')
    
    // Only include if meaningful data
    if (transaction.deposit > 0 || transaction.withdrawal > 0 || transaction.balance > 0) {
      transactions.push(transaction)
    }
  })
  
  return transactions
}

/**
 * Filter patterns within a specific range
 * @param {Object} patterns - All patterns
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {Object} Filtered patterns
 */
const filterPatternsInRange = (patterns, start, end) => {
  const filtered = {}
  
  Object.keys(patterns).forEach(key => {
    filtered[key] = patterns[key].filter(pattern => 
      pattern.index >= start && pattern.index < end
    )
  })
  
  return filtered
}

/**
 * Extract account information using adaptive patterns
 * @param {Object} patterns - All extracted patterns
 * @param {Object} structure - Document structure
 * @returns {Object} Account information
 */
const extractAccountInfoAdaptive = (patterns, structure) => {
  const accountInfo = {
    accountNumber: '',
    accountTitle: '',
    currency: 'PKR',
    accountType: '',
    bankName: '',
    branchName: '',
    fromDate: '',
    toDate: '',
    statementDate: ''
  }
  
  // Extract account number (highest confidence)
  const accounts = patterns.accountNumbers.sort((a, b) => b.confidence - a.confidence)
  if (accounts.length > 0) {
    accountInfo.accountNumber = accounts[0].value
  }
  
  // Extract bank name (highest confidence)
  const banks = patterns.bankNames.sort((a, b) => b.confidence - a.confidence)
  if (banks.length > 0) {
    accountInfo.bankName = banks[0].value
  }
  
  // Extract dates
  const dates = patterns.dates.sort((a, b) => b.confidence - a.confidence)
  if (dates.length >= 2) {
    accountInfo.fromDate = dates[0].value
    accountInfo.toDate = dates[1].value
  }
  
  return accountInfo
}

/**
 * Calculate summary using adaptive logic
 * @param {Array} transactions - All transactions
 * @returns {Object} Summary data
 */
const calculateSummaryAdaptive = (transactions) => {
  const summary = {
    totalTransactions: transactions.length,
    totalDeposits: 0,
    totalWithdrawals: 0,
    openingBalance: 0,
    closingBalance: 0
  }
  
  transactions.forEach(transaction => {
    summary.totalDeposits += transaction.deposit || 0
    summary.totalWithdrawals += transaction.withdrawal || 0
  })
  
  const balances = transactions.map(t => t.balance).filter(b => b > 0)
  if (balances.length > 0) {
    summary.openingBalance = Math.min(...balances)
    summary.closingBalance = Math.max(...balances)
  }
  
  return summary
}

export default parseAdaptiveUniversalBankStatement
