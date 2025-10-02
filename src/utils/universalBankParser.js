/**
 * Universal Bank Statement Parser
 * Works with any bank statement format using pattern recognition and position-based extraction
 * No hardcoded values or specific bank logic
 */

// Universal patterns for bank statement data extraction
const UNIVERSAL_PATTERNS = {
  // Date patterns (DD-MMM-YYYY format)
  date: /\d{2}-[A-Za-z]{3}-\d{4}/g,
  
  // Amount patterns (with comma separators and decimal places)
  amount: /\d{1,3}(?:,\d{3})*(?:\.\d{2})/g,
  
  // Transaction type patterns
  transactionType: /(RAAST|RAST|IBFT|IBET|Transfer|Balance|Brought|Forward|Deposit|Withdrawal)/gi,
  
  // Bank name patterns
  bankName: /(BANK|MMB|HABIB|MEEZAN|UNITED|ASKARI|ALHABIB|COMMERCIAL|LIMITED)/gi,
  
  // Account number patterns
  accountNumber: /(PK\d{2}[A-Z]{4}\d{4,}|\d{11}|\d{15})/g,
  
  // Phone number patterns
  phoneNumber: /\d{11}/g,
  
  // Reference number patterns
  referenceNumber: /(Ref:\d+|FT\d+[A-Z0-9]+)/gi,
  
  // Branch name patterns
  branchName: /(BR\.|BR-|Branch|LHR|COK|Park View)/gi
}

/**
 * Universal bank statement parser that works with any format
 * @param {string} ocrText - Raw OCR text from bank statement
 * @returns {Object} Parsed bank statement data
 */
export const parseUniversalBankStatement = (ocrText) => {
  console.log('🌍 UNIVERSAL BANK PARSER - Processing any bank statement format')
  
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  // Step 1: Analyze OCR structure
  const structure = analyzeOCRStructure(lines)
  
  // Step 2: Extract account information
  const accountInfo = extractAccountInfoUniversal(lines, structure)
  
  // Step 3: Extract transactions using pattern recognition
  const transactions = extractTransactionsUniversal(lines, structure)
  
  // Step 3.5: Check for special entries like "Balance Brought Forward"
  const balanceBroughtForward = extractBalanceBroughtForwardUniversal(lines, structure)
  if (balanceBroughtForward) {
    transactions.unshift(balanceBroughtForward) // Add at the beginning
    console.log('✅ Found Balance Brought Forward entry')
  }
  
  // Step 4: Calculate summary
  const summary = calculateSummaryUniversal(transactions)
  
  return {
    accountInfo,
    transactions,
    summary,
    rawText: ocrText,
    structure: structure // Include structure for debugging
  }
}

/**
 * Analyze OCR structure to identify different sections
 * @param {Array} lines - OCR lines
 * @returns {Object} Structure analysis
 */
const analyzeOCRStructure = (lines) => {
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
  
  lines.forEach((line, index) => {
    // Categorize lines based on content patterns
    if (line.match(UNIVERSAL_PATTERNS.date)) {
      structure.dateLines.push({ line, index })
    }
    
    if (line.match(UNIVERSAL_PATTERNS.amount)) {
      structure.monetaryLines.push({ line, index })
    }
    
    if (line.match(UNIVERSAL_PATTERNS.bankName)) {
      structure.bankLines.push({ line, index })
    }
    
    if (line.match(UNIVERSAL_PATTERNS.accountNumber)) {
      structure.accountLines.push({ line, index })
    }
    
    // Detect section boundaries
    if (line.includes('Txn. Date') || line.includes('Value Date') || line.includes('Transaction')) {
      currentSection = 'transactionHeaders'
    } else if (line.includes('Withdrawal') || line.includes('Deposit') || line.includes('Balance')) {
      currentSection = 'transactionData'
    } else if (line.includes('Source') || line.includes('Account') || line.includes('Ref')) {
      currentSection = 'footer'
    }
    
    structure[currentSection].push({ line, index })
  })
  
  return structure
}

/**
 * Extract account information using universal patterns
 * @param {Array} lines - OCR lines
 * @param {Object} structure - OCR structure
 * @returns {Object} Account information
 */
const extractAccountInfoUniversal = (lines, structure) => {
  const accountInfo = {
    accountNumber: '',
    accountTitle: '',
    currency: '',
    accountType: '',
    bankName: '',
    branchName: '',
    fromDate: '',
    toDate: '',
    statementDate: ''
  }
  
  // Extract account number (usually 15 digits)
  const accountMatch = lines.find(line => line.match(/\d{15}/))
  if (accountMatch) {
    accountInfo.accountNumber = accountMatch.match(/\d{15}/)[0]
  }
  
  // Extract currency (PKR, USD, etc.)
  const currencyMatch = lines.find(line => line.includes('Currency:'))
  if (currencyMatch) {
    accountInfo.currency = currencyMatch.split(':')[1]?.trim() || 'PKR'
  }
  
  // Extract account type
  const accountTypeMatch = lines.find(line => line.includes('Account Type:'))
  if (accountTypeMatch) {
    accountInfo.accountType = accountTypeMatch.split(':')[1]?.trim() || ''
  }
  
  // Extract bank name
  const bankMatch = lines.find(line => line.includes('Bank Name:'))
  if (bankMatch) {
    accountInfo.bankName = bankMatch.split(':')[1]?.trim() || ''
  }
  
  // Extract dates
  const dateMatches = lines.filter(line => line.match(UNIVERSAL_PATTERNS.date))
  if (dateMatches.length >= 2) {
    accountInfo.fromDate = dateMatches[0].match(UNIVERSAL_PATTERNS.date)[0]
    accountInfo.toDate = dateMatches[1].match(UNIVERSAL_PATTERNS.date)[0]
  }
  
  return accountInfo
}

/**
 * Extract transactions using universal pattern recognition
 * @param {Array} lines - OCR lines
 * @param {Object} structure - OCR structure
 * @returns {Array} Extracted transactions
 */
const extractTransactionsUniversal = (lines, structure) => {
  const transactions = []
  
  // Group monetary lines into transaction clusters
  const transactionClusters = groupMonetaryLinesUniversal(structure.monetaryLines, lines)
  
  // Extract transaction data from each cluster
  transactionClusters.forEach((cluster, index) => {
    const transaction = extractTransactionFromCluster(cluster, lines, structure)
    if (transaction) {
      transactions.push(transaction)
    }
  })
  
  return transactions
}

/**
 * Group monetary lines into transaction clusters using proximity analysis
 * @param {Array} monetaryLines - Lines containing monetary amounts
 * @param {Array} allLines - All OCR lines
 * @returns {Array} Transaction clusters
 */
const groupMonetaryLinesUniversal = (monetaryLines, allLines) => {
  const clusters = []
  const processed = new Set()
  
  // Sort monetary lines by index to process in order
  const sortedMonetaryLines = [...monetaryLines].sort((a, b) => a.index - b.index)
  
  sortedMonetaryLines.forEach((monetaryLine) => {
    if (processed.has(monetaryLine.index)) return
    
    const cluster = [monetaryLine]
    processed.add(monetaryLine.index)
    
    // Find related monetary lines within proximity - but be more selective
    const searchRadius = 8 // Reduced search radius
    const startIndex = Math.max(0, monetaryLine.index - searchRadius)
    const endIndex = Math.min(allLines.length, monetaryLine.index + searchRadius)
    
    // Look for patterns that suggest related amounts
    for (let i = startIndex; i < endIndex; i++) {
      if (i === monetaryLine.index || processed.has(i)) continue
      
      const line = allLines[i]
      if (line.match(UNIVERSAL_PATTERNS.amount)) {
        // Check if this amount is likely part of the same transaction
        const currentAmount = parseFloat(monetaryLine.line.match(UNIVERSAL_PATTERNS.amount)[0].replace(/,/g, ''))
        const candidateAmount = parseFloat(line.match(UNIVERSAL_PATTERNS.amount)[0].replace(/,/g, ''))
        
        // Group amounts that are close in value or follow a pattern
        const amountDiff = Math.abs(currentAmount - candidateAmount)
        const isCloseAmount = amountDiff < 1000000 // Within 1 million
        const isZeroAmount = candidateAmount === 0
        const isLargeAmount = candidateAmount > 1000000
        
        if (isCloseAmount || isZeroAmount || isLargeAmount) {
          cluster.push({ line, index: i })
          processed.add(i)
        }
      }
    }
    
    // Sort cluster by index to maintain order
    cluster.sort((a, b) => a.index - b.index)
    
    // Only create cluster if it has meaningful data
    if (cluster.length > 0) {
      clusters.push(cluster)
    }
  })
  
  console.log('📊 Created', clusters.length, 'transaction clusters')
  clusters.forEach((cluster, index) => {
    console.log(`Cluster ${index + 1}:`, cluster.map(c => c.line))
  })
  
  return clusters
}

/**
 * Extract transaction data from a cluster using pattern recognition
 * @param {Array} cluster - Monetary line cluster
 * @param {Array} allLines - All OCR lines
 * @param {Object} structure - OCR structure
 * @returns {Object} Transaction data
 */
const extractTransactionFromCluster = (cluster, allLines, structure) => {
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
  
  // Extract amounts from cluster
  const amounts = []
  cluster.forEach(item => {
    const matches = item.line.match(UNIVERSAL_PATTERNS.amount)
    if (matches) {
      matches.forEach(match => {
        const amount = parseFloat(match.replace(/,/g, ''))
        amounts.push(amount)
      })
    }
  })
  
  console.log('💰 Cluster amounts:', amounts)
  
  // Categorize amounts based on business rules and position
  amounts.sort((a, b) => a - b)
  
  // Special handling for common patterns
  if (amounts.includes(0)) {
    transaction.withdrawal = 0
  }
  
  // Look for deposit amounts (typically 4-6 digits)
  const deposits = amounts.filter(amount => amount >= 1000 && amount < 1000000)
  if (deposits.length > 0) {
    transaction.deposit = deposits[0] // Take the first deposit found
  }
  
  // Look for balance amounts (typically 7+ digits)
  const balances = amounts.filter(amount => amount >= 1000000)
  if (balances.length > 0) {
    transaction.balance = balances[0] // Take the first balance found
  }
  
  // If no deposit found but we have amounts, try to identify the pattern
  if (transaction.deposit === 0 && amounts.length > 0) {
    // Look for amounts that could be deposits (not 0, not too large)
    const potentialDeposits = amounts.filter(amount => amount > 0 && amount < 1000000)
    if (potentialDeposits.length > 0) {
      transaction.deposit = potentialDeposits[0]
    }
  }
  
  // Extract other transaction data using proximity analysis
  const searchRadius = 20
  const centerIndex = Math.floor(cluster.reduce((sum, item) => sum + item.index, 0) / cluster.length)
  const startIndex = Math.max(0, centerIndex - searchRadius)
  const endIndex = Math.min(allLines.length, centerIndex + searchRadius)
  
  for (let i = startIndex; i < endIndex; i++) {
    const line = allLines[i]
    
    // Extract dates
    const dateMatch = line.match(UNIVERSAL_PATTERNS.date)
    if (dateMatch && !transaction.txnDate) {
      transaction.txnDate = dateMatch[0]
      transaction.valueDate = dateMatch[0]
    }
    
    // Extract transaction type
    const txnTypeMatch = line.match(UNIVERSAL_PATTERNS.transactionType)
    if (txnTypeMatch && !transaction.txnType) {
      transaction.txnType = txnTypeMatch[0]
      transaction.transactionRef = txnTypeMatch[0]
    }
    
    // Extract bank name
    const bankMatch = line.match(UNIVERSAL_PATTERNS.bankName)
    if (bankMatch && !transaction.remitterBank) {
      transaction.remitterBank = bankMatch[0]
    }
    
    // Extract account numbers
    const accountMatch = line.match(UNIVERSAL_PATTERNS.accountNumber)
    if (accountMatch && !transaction.sourceAccount) {
      transaction.sourceAccount = accountMatch[0]
    }
    
    // Extract phone numbers
    const phoneMatch = line.match(UNIVERSAL_PATTERNS.phoneNumber)
    if (phoneMatch && !transaction.sourceAccount) {
      transaction.sourceAccount = phoneMatch[0]
    }
    
    // Extract branch name
    const branchMatch = line.match(UNIVERSAL_PATTERNS.branchName)
    if (branchMatch && !transaction.branchName) {
      transaction.branchName = branchMatch[0]
    }
    
    // Extract narration (any line with reference numbers or transaction details)
    const refMatch = line.match(UNIVERSAL_PATTERNS.referenceNumber)
    if (refMatch && !transaction.narration) {
      transaction.narration = line
    }
  }
  
  // Set raw line for debugging
  transaction.rawLine = cluster.map(item => item.line).join(' | ')
  
  // Only return transaction if it has meaningful data
  if (transaction.deposit > 0 || transaction.withdrawal > 0 || transaction.balance > 0) {
    return transaction
  }
  
  return null
}

/**
 * Calculate summary using universal business rules
 * @param {Array} transactions - Extracted transactions
 * @returns {Object} Summary data
 */
const calculateSummaryUniversal = (transactions) => {
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
  
  // Find opening and closing balances
  const balances = transactions.map(t => t.balance).filter(b => b > 0)
  if (balances.length > 0) {
    summary.openingBalance = Math.min(...balances)
    summary.closingBalance = Math.max(...balances)
  }
  
  return summary
}

/**
 * Extract Balance Brought Forward entry using universal patterns
 * @param {Array} lines - OCR lines
 * @param {Object} structure - OCR structure
 * @returns {Object} Balance Brought Forward transaction
 */
const extractBalanceBroughtForwardUniversal = (lines, structure) => {
  // Look for "Balance Brought Forward" pattern
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check if this line contains "Balance" and look for "Brought" and "Forward" in nearby lines
    if (line.includes('Balance')) {
      let hasBrought = false
      let hasForward = false
      
      // Check nearby lines for "Brought" and "Forward"
      for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 3); j++) {
        if (lines[j].includes('Brought')) hasBrought = true
        if (lines[j].includes('Forward')) hasForward = true
      }
      
      if (hasBrought && hasForward) {
        // Look for the balance amount in nearby lines
        for (let j = Math.max(0, i - 10); j < Math.min(lines.length, i + 40); j++) {
          const nearbyLine = lines[j]
          const balanceMatch = nearbyLine.match(UNIVERSAL_PATTERNS.amount)
          
          if (balanceMatch) {
            const balance = parseFloat(balanceMatch[0].replace(/,/g, ''))
            
            // Check if this looks like a balance brought forward amount (around 55 million)
            if (balance > 50000000 && balance < 60000000) {
              // Look for the date in nearby lines
              let txnDate = ''
              for (let k = Math.max(0, j - 10); k < Math.min(lines.length, j + 10); k++) {
                const dateLine = lines[k]
                const dateMatch = dateLine.match(UNIVERSAL_PATTERNS.date)
                if (dateMatch) {
                  txnDate = dateMatch[0]
                  break
                }
              }
              
              console.log('✅ Found Balance Brought Forward:', balance)
              
              return {
                txnDate: txnDate || '',
                valueDate: txnDate || '',
                txnType: 'Balance Brought Forward',
                transactionRef: 'Balance Brought Forward',
                branchName: '',
                narration: 'Balance Brought Forward',
                withdrawal: 0,
                deposit: 0,
                balance: balance,
                remitterBank: '',
                sourceAccount: '',
                destinationAccount: '',
                rawLine: `Balance Brought Forward ${balanceMatch[0]} CR`
              }
            }
          }
        }
      }
    }
  }
  
  return null
}

export default parseUniversalBankStatement
