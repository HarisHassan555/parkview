/**
 * Parse reconciled report CSV or XLSX file
 */
export const parseReconciledReport = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (fileExtension === 'xlsx') {
    return parseXLSXFile(file);
  } else {
    return parseCSVFile(file);
  }
};

/**
 * Parse comparison report CSV or XLSX file
 */
export const parseComparisonReport = async (file) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (fileExtension === 'xlsx') {
    return parseXLSXFile(file);
  } else {
    return parseCSVFile(file);
  }
};

/**
 * Parse CSV file
 */
const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file must have at least a header and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }
        }
        
        console.log('Parsed CSV file:', { headers, recordCount: data.length });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
};

/**
 * Parse XLSX file
 */
const parseXLSXFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Import XLSX library dynamically
        import('xlsx').then((XLSX) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('XLSX file must have at least a header and one data row');
          }
          
          const headers = jsonData[0].map(h => h ? h.toString().trim() : '');
          const parsedData = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = {};
            headers.forEach((header, index) => {
              const value = jsonData[i][index];
              row[header] = value ? value.toString() : '';
            });
            parsedData.push(row);
          }
          
          console.log('Parsed XLSX file:', { headers, recordCount: parsedData.length });
          resolve(parsedData);
        }).catch((error) => {
          reject(new Error('Failed to parse XLSX file: ' + error.message));
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read XLSX file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parse a single CSV line handling quoted values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

/**
 * Normalize date for comparison
 */
const normalizeDate = (dateStr) => {
  if (!dateStr) return null;
  
  try {
    // Try different date formats
    let date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // Try parsing as DD/MM/YYYY or DD-MM-YYYY
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        date = new Date(`${year}-${month}-${day}`);
      }
    }
    
    if (isNaN(date.getTime())) {
      // Try parsing month name format like "September 10, 2025"
      const monthNames = {
        'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
        'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
      };
      
      const lowerDateStr = dateStr.toLowerCase();
      for (const [monthName, monthIndex] of Object.entries(monthNames)) {
        if (lowerDateStr.includes(monthName)) {
          const parts = dateStr.split(/[\s,]+/);
          const day = parts.find(part => /^\d+$/.test(part));
          const year = parts.find(part => /^\d{4}$/.test(part));
          if (day && year) {
            date = new Date(parseInt(year), monthIndex, parseInt(day));
            break;
          }
        }
      }
    }
    
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('Date parsing error:', dateStr, error);
    return null;
  }
};

/**
 * Normalize name for comparison (rough match)
 */
const normalizeName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Calculate name similarity score (0-1)
 */
const calculateNameSimilarity = (name1, name2) => {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  if (norm1 === norm2) return 1;
  if (!norm1 || !norm2) return 0;
  
  // Check if one name is contained in the other (for cases like "ASIF RAZA" vs "ASIF RAZA MUHAMMAD HANIF")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.8; // High similarity for contained names
  }
  
  // Simple similarity based on common words
  const words1 = norm1.split(' ');
  const words2 = norm2.split(' ');
  
  let commonWords = 0;
  const totalWords = Math.max(words1.length, words2.length);
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 && word1.length > 2) {
        commonWords++;
        break;
      }
    }
  }
  
  return commonWords / totalWords;
};

/**
 * Check if source account matches telephone number (substring match)
 */
const checkSourceAccountToTelephoneMatch = (sourceAccount, telephone) => {
  if (!sourceAccount || !telephone) return false;
  
  // Clean both values - remove non-digits
  const cleanSourceAccount = sourceAccount.replace(/\D/g, '');
  const cleanTelephone = telephone.replace(/\D/g, '');
  
  // Check if source account is contained in telephone or vice versa
  const sourceInTelephone = cleanTelephone.includes(cleanSourceAccount);
  const telephoneInSource = cleanSourceAccount.includes(cleanTelephone);
  
  console.log('Source account to telephone match:', {
    sourceAccount,
    telephone,
    cleanSourceAccount,
    cleanTelephone,
    sourceInTelephone,
    telephoneInSource,
    match: sourceInTelephone || telephoneInSource
  });
  
  return sourceInTelephone || telephoneInSource;
};

/**
 * Parse currency value
 */
const parseCurrencyValue = (value) => {
  if (!value) return 0;
  
  // Remove currency symbols and text
  const cleanValue = value.toString()
    .replace(/[^\d.,\-]/g, '')
    .replace(/,/g, '');
  
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * Match reports and return comparison results
 */
export const matchReports = async (reconciledData, comparisonData) => {
  console.log('Starting report matching...', {
    reconciledCount: reconciledData.length,
    comparisonCount: comparisonData.length
  });
  
  const results = {
    verified: [],
    unverified: [],
    partialMatches: [],
    noMatches: []
  };
  
  // Process each reconciled entry
  for (const reconciledEntry of reconciledData) {
    const reconciledDate = normalizeDate(reconciledEntry['Txn. Date']);
    const reconciledName = reconciledEntry['Sender Name'] || '';
    // Try multiple possible amount fields - prioritize Deposit for reconciled data
    const reconciledAmount = parseCurrencyValue(
      reconciledEntry['Deposit'] || 
      reconciledEntry['Withdrawal'] || 
      reconciledEntry['Amount'] ||
      reconciledEntry['Company Code Currency Value'] ||
      reconciledEntry['Balance'] ||
      ''
    );
    
    // Debug amount parsing for ASIF RAZA
    if (reconciledName === 'ASIF RAZA') {
      console.log('ASIF RAZA amount debugging:', {
        withdrawal: reconciledEntry['Withdrawal'],
        deposit: reconciledEntry['Deposit'],
        amount: reconciledEntry['Amount'],
        balance: reconciledEntry['Balance'],
        parsedAmount: reconciledAmount
      });
    }
    
    console.log('Processing reconciled entry:', {
      date: reconciledEntry['Txn. Date'],
      name: reconciledName,
      amount: reconciledAmount,
      sourceAccount: reconciledEntry['Source Account'],
      allFields: Object.keys(reconciledEntry),
      withdrawal: reconciledEntry['Withdrawal'],
      deposit: reconciledEntry['Deposit'],
      balance: reconciledEntry['Balance'],
      allValues: Object.values(reconciledEntry),
      fullEntry: reconciledEntry
    });
    
    if (!reconciledName) {
      results.unverified.push({
        ...reconciledEntry,
        reason: 'Missing name',
        type: 'reconciled'
      });
      continue;
    }
    
    // Find potential matches in comparison data
    const potentialMatches = [];
    const aggregatedMatches = new Map(); // Group by customer name and optional date
    
    for (const comparisonEntry of comparisonData) {
      const comparisonDate = normalizeDate(comparisonEntry['Posting Date']);
      // Use Customer Account: Name 1 instead of Customer
      const comparisonName = comparisonEntry['Customer Account: Name 1'] || comparisonEntry['Customer'] || '';
      const comparisonAmount = parseCurrencyValue(comparisonEntry['Company Code Currency Value'] || '');
      const comparisonTelephone = comparisonEntry['Telephone 1'] || '';
      
      if (!comparisonName) continue;
      
      // Check name similarity
      const nameSimilarity = calculateNameSimilarity(reconciledName, comparisonName);
      const nameMatch = nameSimilarity > 0.6; // 60% similarity threshold
      
      console.log('Checking comparison entry:', {
        date: comparisonEntry['Posting Date'],
        name: comparisonName,
        amount: comparisonAmount,
        nameSimilarity,
        nameMatch,
        allFields: Object.keys(comparisonEntry)
      });
      
      // Match if name matches (no other requirements)
      if (nameMatch) {
        // Group entries by customer name for aggregation
        const key = comparisonName;
        if (!aggregatedMatches.has(key)) {
          aggregatedMatches.set(key, {
            entries: [],
            totalAmount: 0,
            nameSimilarity: nameSimilarity
          });
        }
        
        const group = aggregatedMatches.get(key);
        group.entries.push(comparisonEntry);
        group.totalAmount += comparisonAmount;
        group.nameSimilarity = Math.max(group.nameSimilarity, nameSimilarity);
      }
    }
    
    // Check aggregated matches
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [key, group] of aggregatedMatches) {
      const amountMatch = Math.abs(reconciledAmount - group.totalAmount) < 0.01;
      const amountDifference = Math.abs(reconciledAmount - group.totalAmount);
      
      const score = (group.nameSimilarity * 0.7) + (amountMatch ? 0.3 : 0);
      
      console.log('Aggregated match:', {
        key,
        totalAmount: group.totalAmount,
        reconciledAmount,
        amountMatch,
        amountDifference,
        score,
        reconciledAmountType: typeof reconciledAmount,
        totalAmountType: typeof group.totalAmount,
        exactMatch: reconciledAmount === group.totalAmount,
        rawReconciledAmount: reconciledEntry['Deposit'],
        rawComparisonAmounts: group.entries.map(e => e['Company Code Currency Value'])
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          entries: group.entries,
          totalAmount: group.totalAmount,
          nameSimilarity: group.nameSimilarity,
          amountMatch,
          amountDifference
        };
      }
    }
    
    if (!bestMatch) {
      results.noMatches.push({
        ...reconciledEntry,
        reason: 'No matching entries found',
        type: 'reconciled'
      });
    } else if (bestMatch.amountMatch) {
      // Perfect match
      results.verified.push({
        reconciled: reconciledEntry,
        comparison: bestMatch.entries,
        matchScore: (bestMatch.nameSimilarity * 0.7) + 0.3,
        nameSimilarity: bestMatch.nameSimilarity,
        aggregatedAmount: bestMatch.totalAmount
      });
    } else {
      // Partial match (name matches but amount doesn't)
      results.partialMatches.push({
        reconciled: reconciledEntry,
        comparison: bestMatch.entries,
        matchScore: bestMatch.nameSimilarity * 0.7,
        nameSimilarity: bestMatch.nameSimilarity,
        amountDifference: bestMatch.amountDifference,
        aggregatedAmount: bestMatch.totalAmount
      });
    }
  }
  
  // Find unmatched comparison entries
  const matchedComparisonIds = new Set();
  results.verified.forEach(match => {
    match.comparison.forEach(entry => {
      const index = comparisonData.findIndex(compEntry => compEntry === entry);
      if (index !== -1) matchedComparisonIds.add(index);
    });
  });
  results.partialMatches.forEach(match => {
    match.comparison.forEach(entry => {
      const index = comparisonData.findIndex(compEntry => compEntry === entry);
      if (index !== -1) matchedComparisonIds.add(index);
    });
  });
  
  for (let i = 0; i < comparisonData.length; i++) {
    if (!matchedComparisonIds.has(i)) {
      results.unverified.push({
        ...comparisonData[i],
        reason: 'No matching reconciled entry',
        type: 'comparison'
      });
    }
  }
  
  console.log('Matching completed:', {
    verified: results.verified.length,
    unverified: results.unverified.length,
    partialMatches: results.partialMatches.length,
    noMatches: results.noMatches.length
  });
  
  return results;
};

/**
 * Export comparison results to CSV
 */
export const exportComparisonResults = (results, filename = 'comparison_results.csv') => {
  const headers = [
    'Type',
    'Status',
    'Date',
    'Name',
    'Amount',
    'Match Score',
    'Reason',
    'Document Number',
    'Transaction ID'
  ];
  
  const csvRows = [];
  
  // Add verified matches
  results.verified.forEach(match => {
    csvRows.push([
      'Reconciled',
      'Verified',
      match.reconciled['Txn. Date'],
      match.reconciled['Sender Name'],
      match.reconciled['Withdrawal'] || match.reconciled['Deposit'],
      match.matchScore.toFixed(2),
      'Perfect match',
      match.comparison['Document Number'],
      match.reconciled['Transaction ID']
    ]);
  });
  
  // Add partial matches
  results.partialMatches.forEach(match => {
    csvRows.push([
      'Reconciled',
      'Partial Match',
      match.reconciled['Txn. Date'],
      match.reconciled['Sender Name'],
      match.reconciled['Withdrawal'] || match.reconciled['Deposit'],
      match.matchScore.toFixed(2),
      `Amount difference: ${match.amountDifference}`,
      match.comparison['Document Number'],
      match.reconciled['Transaction ID']
    ]);
  });
  
  // Add unverified entries
  results.unverified.forEach(entry => {
    csvRows.push([
      entry.type === 'reconciled' ? 'Reconciled' : 'Comparison',
      'Unverified',
      entry['Txn. Date'] || entry['Posting Date'],
      entry['Sender Name'] || entry['Customer Account: Name 1'] || entry['Customer'],
      entry['Withdrawal'] || entry['Deposit'] || entry['Company Code Currency Value'],
      '0.00',
      entry.reason || 'No match found',
      entry['Document Number'] || '',
      entry['Transaction ID'] || ''
    ]);
  });
  
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
