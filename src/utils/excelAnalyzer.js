import * as XLSX from 'xlsx';

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
  
  // Strict comparison logic - ALL 3 conditions must be met
  const comparisonResults = {
    amountMatch: false,
    accountMatch: false,
    nameMatch: false
  };
  
  // 1. Compare Amount with Deposit ONLY (not Withdrawal)
  const docAmount = paymentData.amount;
  console.log('💰 Amount comparison (Deposit only):', {
    docAmount,
    docAmountType: typeof docAmount,
    excelDeposit: excelEntry['Deposit']
  });
  
  if (docAmount) {
    const docNum = parseFloat(docAmount.toString().replace(/[^\d.-]/g, ''));
    
    // Use exact column name: "Deposit"
    const depositValue = excelEntry['Deposit'];
    
    if (depositValue && depositValue !== '0' && depositValue !== 0) {
      const excelNum = parseFloat(depositValue.toString().replace(/[^\d.-]/g, ''));
      if (!isNaN(docNum) && !isNaN(excelNum) && docNum === excelNum) {
        comparisonResults.amountMatch = true;
        matchCount++;
        matches.push({
          field: 'amount',
          docValue: docAmount,
          excelValue: depositValue,
          excelField: 'Deposit'
        });
      }
    }
  }
  
  // 2. Compare Sender Account with Source Account ONLY
  const docFromAccount = paymentData.fromAccount;
  
  console.log('🏦 Sender Account comparison:', {
    docFromAccount,
    excelSourceAccount: excelEntry['Source Account']
  });
  
  if (docFromAccount) {
    // Use exact column name: "Source Account"
    const sourceAccount = excelEntry['Source Account'];
    
    // ONLY check if sender account matches source account
    if (sourceAccount && docFromAccount.toString().trim() === sourceAccount.toString().trim()) {
      comparisonResults.accountMatch = true;
      matchCount++;
      matches.push({
        field: 'fromAccount',
        docValue: docFromAccount,
        excelValue: sourceAccount,
        excelField: 'Source Account'
      });
    }
  }
  
  // 3. Extract and compare SENDER name from Narration / Transaction Detail
  const docFromName = paymentData.fromName;
  
  console.log('👤 Sender Name comparison:', {
    docFromName,
    narration: excelEntry['Narration / Transaction Detail']?.substring(0, 100) + '...', // Show first 100 chars
    narrationLength: excelEntry['Narration / Transaction Detail']?.length
  });
  
  if (docFromName) {
    // Use exact column name: "Narration / Transaction Detail"
    const narration = excelEntry['Narration / Transaction Detail'];
    
    if (narration) {
      const narrationText = narration.toString().toLowerCase();
      const senderName = docFromName.toString().toLowerCase();
      
      // Check if sender name appears in narration
      if (narrationText.includes(senderName)) {
        comparisonResults.nameMatch = true;
        matchCount++;
        matches.push({
          field: 'fromName',
          docValue: docFromName,
          excelValue: narration,
          excelField: 'Narration / Transaction Detail'
        });
      }
    }
  }
  
  // Success criteria: ANY 2 of 3 conditions must be met (flexible verification)
  const keyMatches = [
    comparisonResults.amountMatch,
    comparisonResults.accountMatch,
    comparisonResults.nameMatch
  ].filter(Boolean).length;
  
  const isVerified = keyMatches >= 2;
  
  console.log('🎯 Final comparison results (FLEXIBLE):', {
    comparisonResults,
    keyMatches,
    isVerified,
    matchCount,
    matches,
    requirements: {
      amountMatch: comparisonResults.amountMatch,
      accountMatch: comparisonResults.accountMatch,
      nameMatch: comparisonResults.nameMatch
    }
  });
  
  return {
    isMatch: isVerified, // ANY 2 of 3 conditions must be true
    matchCount,
    totalFields: 3,
    matches,
    comparisonResults
  };
};

export default {
  analyzeBankStatementExcel,
  getFieldMappings,
  findMatchingField,
  compareDocumentWithExcelFlexible
};
