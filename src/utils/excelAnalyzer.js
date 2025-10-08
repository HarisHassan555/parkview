import * as XLSX from 'xlsx';

/**
 * Normalize date formats for comparison
 * Converts extracted date format (03-Sep-2025 at 08:56:05 PM) to Excel format (3-Sep-25)
 */
export const normalizeDateForComparison = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Handle extracted date format: "03-Sep-2025 at 08:56:05 PM"
    const extractedDateMatch = dateString.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (extractedDateMatch) {
      const [, day, month, year] = extractedDateMatch;
      // Convert to Excel format: "3-Sep-25"
      const shortYear = year.slice(-2);
      return `${parseInt(day)}-${month}-${shortYear}`;
    }
    
    // Handle Excel format: "3-Sep-25" (already normalized)
    const excelDateMatch = dateString.match(/(\d{1,2})-([A-Za-z]{3})-(\d{2})/);
    if (excelDateMatch) {
      return dateString; // Already in correct format
    }
    
    // Handle other date formats if needed
    return dateString;
  } catch (error) {
    console.error('Error normalizing date:', error);
    return dateString;
  }
};

/**
 * Compare two dates for matching (with tolerance for format differences)
 */
export const compareDates = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const normalizedDate1 = normalizeDateForComparison(date1);
  const normalizedDate2 = normalizeDateForComparison(date2);
  
  return normalizedDate1 === normalizedDate2;
};

/**
 * Read and analyze the BankStatementNew.xlsx file to understand its structure
 */
export const analyzeBankStatementExcel = async () => {
  try {
    // Read the Excel file
    const response = await fetch('/src/utils/BankStatementNew.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('📊 Excel File Analysis:');
    console.log('Sheet Name:', sheetName);
    console.log('Total Rows:', jsonData.length);
    
    if (jsonData.length > 0) {
      console.log('Sample Row:', jsonData[0]);
      console.log('Available Fields:', Object.keys(jsonData[0]));
    }
    
    return {
      success: true,
      sheetName,
      totalRows: jsonData.length,
      sampleRow: jsonData[0] || {},
      availableFields: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
      allData: jsonData
    };
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get field mappings for comparison based on exact bank statement column names
 */
export const getFieldMappings = () => {
  return {
    // Document fields -> Exact Bank Statement Excel column names
    amount: ['Deposit'], // Only Deposit column for amount matching
    fromAccount: ['Source Account'], // Only Source Account for sender account matching
    fromName: ['Narration / Transaction Detail'], // Only Narration for name matching
    
    // Other available columns (not used in strict verification)
    toAccount: ['Destination Account'],
    transactionId: ['Txn. Ref No. / Inst. / Voucher No.'],
    date: ['Txn. Date', 'Value Date'],
    transactionType: ['Transaction Type'],
    service: ['Remitter Bank', 'Br. Name'],
    withdrawal: ['Withdrawal'],
    balance: ['Balance']
  };
};

/**
 * Find the best matching field in Excel data
 */
export const findMatchingField = (excelRow, targetField) => {
  const fieldMappings = getFieldMappings();
  const possibleFields = fieldMappings[targetField] || [targetField];
  
  for (const possibleField of possibleFields) {
    if (excelRow.hasOwnProperty(possibleField)) {
      return possibleField;
    }
  }
  
  return null;
};

/**
 * Compare a document with Excel data using bank statement specific logic
 */
export const compareDocumentWithExcelFlexible = (document, excelEntry) => {
  if (!document.extractedData || document.documentType !== 'mobile_payment') {
    return false;
  }
  
  // Handle both direct extractedData and nested data structure
  const paymentData = document.extractedData.data || document.extractedData;
  
  // Debug logging
  console.log('🔍 Document data structure:', {
    hasExtractedData: !!document.extractedData,
    hasData: !!document.extractedData?.data,
    paymentData: paymentData,
    documentType: document.documentType
  });
  
  let matchCount = 0;
  const matches = [];
  
  // New comparison logic - 5 conditions, need any 3 to match
  const comparisonResults = {
    dateMatch: false,
    depositMatch: false,
    sourceAccountMatch: false,
    destinationAccountMatch: false,
    senderNameMatch: false
  };
  
  // 1. Compare Txn. Date with Txn. Date from Excel
  const docDate = paymentData.date;
  console.log('📅 Date comparison:', {
    docDate,
    excelTxnDate: excelEntry['Txn. Date']
  });
  
  if (docDate) {
    const excelTxnDate = excelEntry['Txn. Date'];
    if (excelTxnDate) {
      if (compareDates(docDate, excelTxnDate)) {
        comparisonResults.dateMatch = true;
        matchCount++;
        matches.push({
          field: 'date',
          docValue: docDate,
          excelValue: excelTxnDate,
          excelField: 'Txn. Date'
        });
      }
    }
  }
  
  // 2. Compare Deposit with Deposit from Excel
  const docAmount = paymentData.amount;
  console.log('💰 Deposit comparison:', {
    docAmount,
    excelDeposit: excelEntry['Deposit']
  });
  
  if (docAmount) {
    const docNum = parseFloat(docAmount.toString().replace(/[^\d.-]/g, ''));
    const depositValue = excelEntry['Deposit'];
    
    if (depositValue && depositValue !== '0' && depositValue !== 0) {
      const excelNum = parseFloat(depositValue.toString().replace(/[^\d.-]/g, ''));
      if (!isNaN(docNum) && !isNaN(excelNum) && docNum === excelNum) {
        comparisonResults.depositMatch = true;
        matchCount++;
        matches.push({
          field: 'deposit',
          docValue: docAmount,
          excelValue: depositValue,
          excelField: 'Deposit'
        });
      }
    }
  }
  
  // 3. Compare Source Account last 4 digits
  const docFromAccount = paymentData.fromAccount;
  console.log('🏦 Source Account comparison (last 4 digits):', {
    docFromAccount,
    excelSourceAccount: excelEntry['Source Account']
  });
  
  if (docFromAccount) {
    const sourceAccount = excelEntry['Source Account'];
    if (sourceAccount) {
      const docLast4 = docFromAccount.toString().slice(-4);
      const excelLast4 = sourceAccount.toString().slice(-4);
      
      if (docLast4 === excelLast4 && docLast4.length === 4) {
        comparisonResults.sourceAccountMatch = true;
        matchCount++;
        matches.push({
          field: 'sourceAccount',
          docValue: docFromAccount,
          excelValue: sourceAccount,
          excelField: 'Source Account'
        });
      }
    }
  }
  
  // 4. Compare Destination Account last 4 digits
  const docToAccount = paymentData.toAccount;
  console.log('🏦 Destination Account comparison (last 4 digits):', {
    docToAccount,
    excelDestinationAccount: excelEntry['Destination Account']
  });
  
  if (docToAccount) {
    const destinationAccount = excelEntry['Destination Account'];
    if (destinationAccount) {
      const docLast4 = docToAccount.toString().slice(-4);
      const excelLast4 = destinationAccount.toString().slice(-4);
      
      if (docLast4 === excelLast4 && docLast4.length === 4) {
        comparisonResults.destinationAccountMatch = true;
        matchCount++;
        matches.push({
          field: 'destinationAccount',
          docValue: docToAccount,
          excelValue: destinationAccount,
          excelField: 'Destination Account'
        });
      }
    }
  }
  
  // 5. Search Sender Name in Narration / Transaction Detail
  const docFromName = paymentData.fromName;
  console.log('👤 Sender Name search in Narration:', {
    docFromName,
    narration: excelEntry['Narration / Transaction Detail']?.substring(0, 100) + '...'
  });
  
  if (docFromName) {
    const narration = excelEntry['Narration / Transaction Detail'];
    if (narration) {
      const narrationText = narration.toString().toLowerCase();
      const senderName = docFromName.toString().toLowerCase();
      
      if (narrationText.includes(senderName)) {
        comparisonResults.senderNameMatch = true;
        matchCount++;
        matches.push({
          field: 'senderName',
          docValue: docFromName,
          excelValue: narration,
          excelField: 'Narration / Transaction Detail'
        });
      }
    }
  }
  
  // Success criteria: ANY 3 of 5 conditions must be met
  const keyMatches = [
    comparisonResults.dateMatch,
    comparisonResults.depositMatch,
    comparisonResults.sourceAccountMatch,
    comparisonResults.destinationAccountMatch,
    comparisonResults.senderNameMatch
  ].filter(Boolean).length;
  
  const isVerified = keyMatches >= 3;
  
  console.log('🎯 Final comparison results (NEW CRITERIA):', {
    comparisonResults,
    keyMatches,
    isVerified,
    matchCount,
    matches,
    requirements: {
      dateMatch: comparisonResults.dateMatch,
      depositMatch: comparisonResults.depositMatch,
      sourceAccountMatch: comparisonResults.sourceAccountMatch,
      destinationAccountMatch: comparisonResults.destinationAccountMatch,
      senderNameMatch: comparisonResults.senderNameMatch
    }
  });
  
  return {
    isMatch: isVerified, // ANY 3 of 5 conditions must be true
    matchCount,
    totalFields: 5,
    matches,
    comparisonResults
  };
};

export default {
  analyzeBankStatementExcel,
  getFieldMappings,
  findMatchingField,
  compareDocumentWithExcelFlexible,
  normalizeDateForComparison,
  compareDates
};
