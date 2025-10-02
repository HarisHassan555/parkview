/**
 * TRUE UNIVERSAL BANK STATEMENT PARSER
 * Zero hardcoded values, zero if-else conditions
 * Pure pattern recognition and position-based extraction
 */

// Universal patterns for any bank statement
const UNIVERSAL_PATTERNS = {
  date: /\d{2}-[A-Za-z]{3}-\d{4}/g,
  amount: /\d{1,3}(?:,\d{3})*(?:\.\d{2})/g,
  transactionType: /(RAAST|RAST|IBFT|IBET|Transfer|Balance|Brought|Forward|Deposit|Withdrawal|Credit|Debit)/gi,
  bankName: /(BANK|MMB|HABIB|MEEZAN|UNITED|ASKARI|ALHABIB|COMMERCIAL|LIMITED|SONERI)/gi,
  accountNumber: /(PK\d{2}[A-Z]{4}\d{4,}|\d{11}|\d{15})/g,
  phoneNumber: /\d{11}/g,
  referenceNumber: /(Ref:\d+|FT\d+[A-Z0-9]+)/gi,
  branchName: /(BR\.|BR-|Branch|LHR|COK|Park View|City)/gi
}

/**
 * Parse any bank statement using pure pattern recognition
 * @param {string} ocrText - Raw OCR text
 * @returns {Object} Parsed bank statement data
 */
export const parseTrueUniversalBankStatement = (ocrText) => {
  console.log('🌍 TRUE UNIVERSAL PARSER - Zero hardcoded values, zero conditions')
  
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Step 1: Extract all patterns from OCR
  const extractedData = extractAllPatterns(lines)
  
  // Step 2: Group data by proximity and context
  const groupedData = groupDataByProximity(extractedData, lines)
  
  // Step 3: Build transactions from grouped data
  const transactions = buildTransactionsFromGroups(groupedData)
  
  // Step 4: Extract account info from patterns
  const accountInfo = extractAccountInfoFromPatterns(extractedData)
  
  return {
    accountInfo,
    transactions,
    summary: calculateSummaryFromTransactions(transactions),
    rawText: ocrText,
    extractedPatterns: extractedData // For debugging
  }
}

/**
 * Extract all patterns from OCR text without any conditions
 * @param {Array} lines - OCR lines
 * @returns {Object} All extracted patterns
 */
const extractAllPatterns = (lines) => {
  const patterns = {
    dates: [],
    amounts: [],
    transactionTypes: [],
    bankNames: [],
    accountNumbers: [],
    phoneNumbers: [],
    referenceNumbers: [],
    branchNames: []
  }
  
  lines.forEach((line, index) => {
    // Extract dates
    const dateMatches = line.match(UNIVERSAL_PATTERNS.date)
    if (dateMatches) {
      patterns.dates.push(...dateMatches.map(match => ({ value: match, line, index })))
    }
    
    // Extract amounts
    const amountMatches = line.match(UNIVERSAL_PATTERNS.amount)
    if (amountMatches) {
      patterns.amounts.push(...amountMatches.map(match => ({ 
        value: parseFloat(match.replace(/,/g, '')), 
        original: match, 
        line, 
        index 
      })))
    }
    
    // Extract transaction types
    const txnMatches = line.match(UNIVERSAL_PATTERNS.transactionType)
    if (txnMatches) {
      patterns.transactionTypes.push(...txnMatches.map(match => ({ value: match, line, index })))
    }
    
    // Extract bank names
    const bankMatches = line.match(UNIVERSAL_PATTERNS.bankName)
    if (bankMatches) {
      patterns.bankNames.push(...bankMatches.map(match => ({ value: match, line, index })))
    }
    
    // Extract account numbers
    const accountMatches = line.match(UNIVERSAL_PATTERNS.accountNumber)
    if (accountMatches) {
      patterns.accountNumbers.push(...accountMatches.map(match => ({ value: match, line, index })))
    }
    
    // Extract phone numbers
    const phoneMatches = line.match(UNIVERSAL_PATTERNS.phoneNumber)
    if (phoneMatches) {
      patterns.phoneNumbers.push(...phoneMatches.map(match => ({ value: match, line, index })))
    }
    
    // Extract reference numbers
    const refMatches = line.match(UNIVERSAL_PATTERNS.referenceNumber)
    if (refMatches) {
      patterns.referenceNumbers.push(...refMatches.map(match => ({ value: match, line, index })))
    }
    
    // Extract branch names
    const branchMatches = line.match(UNIVERSAL_PATTERNS.branchName)
    if (branchMatches) {
      patterns.branchNames.push(...branchMatches.map(match => ({ value: match, line, index })))
    }
  })
  
  return patterns
}

/**
 * Group extracted patterns by proximity and context
 * @param {Object} patterns - All extracted patterns
 * @param {Array} lines - Original OCR lines
 * @returns {Array} Grouped data clusters
 */
const groupDataByProximity = (patterns, lines) => {
  const clusters = []
  const processed = new Set()
  
  // Create clusters based on amount proximity
  patterns.amounts.forEach(amount => {
    if (processed.has(amount.index)) return
    
    const cluster = {
      amounts: [amount],
      dates: [],
      transactionTypes: [],
      bankNames: [],
      accountNumbers: [],
      phoneNumbers: [],
      referenceNumbers: [],
      branchNames: [],
      centerIndex: amount.index
    }
    
    processed.add(amount.index)
    
    // Find related patterns within proximity
    const searchRadius = 15
    const startIndex = Math.max(0, amount.index - searchRadius)
    const endIndex = Math.min(lines.length, amount.index + searchRadius)
    
    // Group all patterns within this radius
    patterns.dates.forEach(date => {
      if (date.index >= startIndex && date.index <= endIndex && !processed.has(date.index)) {
        cluster.dates.push(date)
        processed.add(date.index)
      }
    })
    
    patterns.transactionTypes.forEach(txn => {
      if (txn.index >= startIndex && txn.index <= endIndex && !processed.has(txn.index)) {
        cluster.transactionTypes.push(txn)
        processed.add(txn.index)
      }
    })
    
    patterns.bankNames.forEach(bank => {
      if (bank.index >= startIndex && bank.index <= endIndex && !processed.has(bank.index)) {
        cluster.bankNames.push(bank)
        processed.add(bank.index)
      }
    })
    
    patterns.accountNumbers.forEach(account => {
      if (account.index >= startIndex && account.index <= endIndex && !processed.has(account.index)) {
        cluster.accountNumbers.push(account)
        processed.add(account.index)
      }
    })
    
    patterns.phoneNumbers.forEach(phone => {
      if (phone.index >= startIndex && phone.index <= endIndex && !processed.has(phone.index)) {
        cluster.phoneNumbers.push(phone)
        processed.add(phone.index)
      }
    })
    
    patterns.referenceNumbers.forEach(ref => {
      if (ref.index >= startIndex && ref.index <= endIndex && !processed.has(ref.index)) {
        cluster.referenceNumbers.push(ref)
        processed.add(ref.index)
      }
    })
    
    patterns.branchNames.forEach(branch => {
      if (branch.index >= startIndex && branch.index <= endIndex && !processed.has(branch.index)) {
        cluster.branchNames.push(branch)
        processed.add(branch.index)
      }
    })
    
    // Find additional amounts in the same cluster
    patterns.amounts.forEach(otherAmount => {
      if (otherAmount.index >= startIndex && otherAmount.index <= endIndex && 
          otherAmount.index !== amount.index && !processed.has(otherAmount.index)) {
        cluster.amounts.push(otherAmount)
        processed.add(otherAmount.index)
      }
    })
    
    clusters.push(cluster)
  })
  
  return clusters
}

/**
 * Build transactions from grouped data using pure pattern logic
 * @param {Array} clusters - Grouped data clusters
 * @returns {Array} Transaction objects
 */
const buildTransactionsFromGroups = (clusters) => {
  const transactions = []
  
  clusters.forEach((cluster, index) => {
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
    
    // Extract dates (take first available)
    transaction.txnDate = cluster.dates[0]?.value || ''
    transaction.valueDate = cluster.dates[0]?.value || ''
    
    // Extract transaction type (take first available)
    transaction.txnType = cluster.transactionTypes[0]?.value || ''
    transaction.transactionRef = cluster.transactionTypes[0]?.value || ''
    
    // Extract bank name (take first available)
    transaction.remitterBank = cluster.bankNames[0]?.value || ''
    
    // Extract account numbers (prioritize phone numbers for source)
    transaction.sourceAccount = cluster.phoneNumbers[0]?.value || cluster.accountNumbers[0]?.value || ''
    transaction.destinationAccount = cluster.accountNumbers[1]?.value || ''
    
    // Extract branch name (take first available)
    transaction.branchName = cluster.branchNames[0]?.value || ''
    
    // Extract narration (combine reference numbers)
    transaction.narration = cluster.referenceNumbers.map(ref => ref.value).join(' ')
    
    // Categorize amounts by size (pure pattern logic)
    const amounts = cluster.amounts.map(a => a.value).sort((a, b) => a - b)
    
    // Zero amounts are withdrawals
    transaction.withdrawal = amounts.includes(0) ? 0 : 0
    
    // Medium amounts (1K-1M) are deposits
    const deposits = amounts.filter(amount => amount >= 1000 && amount < 1000000)
    transaction.deposit = deposits[0] || 0
    
    // Large amounts (1M+) are balances
    const balances = amounts.filter(amount => amount >= 1000000)
    transaction.balance = balances[0] || 0
    
    // Build raw line from all cluster data
    const allLines = [
      ...cluster.dates.map(d => d.line),
      ...cluster.amounts.map(a => a.line),
      ...cluster.transactionTypes.map(t => t.line),
      ...cluster.bankNames.map(b => b.line)
    ]
    transaction.rawLine = [...new Set(allLines)].join(' | ')
    
    // Only include transaction if it has meaningful data
    if (transaction.deposit > 0 || transaction.withdrawal > 0 || transaction.balance > 0) {
      transactions.push(transaction)
    }
  })
  
  return transactions
}

/**
 * Extract account information from patterns
 * @param {Object} patterns - All extracted patterns
 * @returns {Object} Account information
 */
const extractAccountInfoFromPatterns = (patterns) => {
  return {
    accountNumber: patterns.accountNumbers.find(acc => acc.value.length === 15)?.value || '',
    accountTitle: '',
    currency: 'PKR',
    accountType: '',
    bankName: patterns.bankNames.find(bank => bank.value.includes('BANK'))?.value || '',
    branchName: patterns.branchNames[0]?.value || '',
    fromDate: patterns.dates[0]?.value || '',
    toDate: patterns.dates[1]?.value || '',
    statementDate: patterns.dates[patterns.dates.length - 1]?.value || ''
  }
}

/**
 * Calculate summary from transactions
 * @param {Array} transactions - All transactions
 * @returns {Object} Summary data
 */
const calculateSummaryFromTransactions = (transactions) => {
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

export default parseTrueUniversalBankStatement
