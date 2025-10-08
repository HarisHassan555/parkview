/**
 * Map extracted transaction data to the standardized table format
 * Based on the table headers: Txn. Date, Value Date, Transaction Type, Txn. Ref No., 
 * Inst. / Voucher No., Br. Name, Narration / Transaction Detail, Withdrawal, 
 * Deposit, Balance, Remitter Bank, Source Account, Destination Account
 */

/**
 * Map a single document's extracted data to table format
 * @param {Object} document - Document with extractedData
 * @returns {Object} Mapped transaction data
 */
export const mapDocumentToTableFormat = (document) => {
  if (!document || !document.extractedData) {
    return createEmptyTransaction();
  }

  const extractedData = document.extractedData.data || document.extractedData;
  
  // Create base transaction object with all required fields
  const transaction = createEmptyTransaction();
  
  // Map based on document type
  if (document.documentType === 'mobile_payment') {
    mapMobilePaymentData(extractedData, transaction);
  } else if (document.documentType === 'bank_statement') {
    mapBankStatementData(extractedData, transaction);
  }
  
  // Add metadata
  transaction.documentId = document.id;
  transaction.fileName = document.fileName;
  transaction.uploadedAt = document.uploadedAt;
  transaction.verificationStatus = document.verificationStatus;
  
  return transaction;
};

/**
 * Map mobile payment data to table format
 */
const mapMobilePaymentData = (data, transaction) => {
  // Txn. Date - from date field with proper formatting
  if (data.date) {
    transaction.txnDate = formatDateForTable(data.date);
  }
  
  // Time - extract from date field
  if (data.date) {
    transaction.time = extractTimeFromDate(data.date);
    console.log('🕐 Time extraction debug:', {
      originalDate: data.date,
      extractedTime: transaction.time
    });
  }
  
  // Transaction Type - determine from service or description
  if (data.service) {
    transaction.transactionType = data.service;
  } else if (data.description) {
    transaction.transactionType = 'Mobile Payment';
  } else {
    transaction.transactionType = 'Mobile Payment';
  }
  
  // Txn. Ref No. - from transactionId
  if (data.transactionId) {
    transaction.txnRefNo = data.transactionId;
    console.log('📋 TxnRefNo extraction debug:', {
      transactionId: data.transactionId,
      txnRefNo: transaction.txnRefNo
    });
  }
  
  // Transaction ID - extract from various sources
  transaction.transactionId = extractTransactionId(data);
  
  // Sender Name - from fromName field
  if (data.fromName) {
    transaction.senderName = data.fromName;
  }
  
  // Amount fields - determine if withdrawal or deposit
  if (data.amount || data.totalAmount) {
    const amount = parseFloat(data.amount || data.totalAmount);
    if (amount > 0) {
      transaction.deposit = amount;
    } else {
      transaction.withdrawal = Math.abs(amount);
    }
  }
  
  // Remitter Bank - from service field
  if (data.service) {
    transaction.remitterBank = data.service;
  }
  
  // Source Account - from fromAccount
  if (data.fromAccount) {
    transaction.sourceAccount = data.fromAccount;
  }
  
  // Destination Account - from toAccount
  if (data.toAccount) {
    transaction.destinationAccount = data.toAccount;
  }
};

/**
 * Map bank statement data to table format
 */
const mapBankStatementData = (data, transaction) => {
  // Use the existing transaction structure from parsers
  transaction.txnDate = formatDateForTable(data.txnDate || '');
  transaction.time = extractTimeFromDate(data.txnDate || '');
  transaction.transactionType = data.txnType || '';
  transaction.txnRefNo = data.transactionRef || '';
  transaction.transactionId = extractTransactionId(data);
  transaction.senderName = data.fromName || data.senderName || '';
  transaction.withdrawal = data.withdrawal || 0;
  transaction.deposit = data.deposit || 0;
  transaction.remitterBank = data.remitterBank || '';
  transaction.sourceAccount = data.sourceAccount || '';
  transaction.destinationAccount = data.destinationAccount || '';
};

/**
 * Create empty transaction object with all required fields
 */
const createEmptyTransaction = () => {
  return {
    txnDate: '',
    time: '',
    transactionType: '',
    txnRefNo: '',
    transactionId: '',
    senderName: '',
    withdrawal: 0,
    deposit: 0,
    remitterBank: '',
    sourceAccount: '',
    destinationAccount: '',
    // Metadata
    documentId: '',
    fileName: '',
    uploadedAt: null,
    verificationStatus: null
  };
};

/**
 * Format date for table display - always returns DD-MMM-YYYY format
 */
const formatDateForTable = (dateString) => {
  if (!dateString) return '';
  
  try {
    let datePart = dateString;
    
    // Handle various date formats
    if (dateString.includes(' at ')) {
      // Extract date part from "03-Sep-2025 at 08:56:05 PM"
      datePart = dateString.split(' at ')[0];
    }
    
    // Ensure the format is DD-MMM-YYYY
    const dateMatch = datePart.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      // Ensure day is zero-padded if needed
      const paddedDay = day.padStart(2, '0');
      return `${paddedDay}-${month}-${year}`;
    }
    
    // If no match, return as-is
    return datePart;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Extract time from date string - returns HH:MM:SS AM/PM format
 */
const extractTimeFromDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Handle format like "02-Oct-2025 at 12:40:17 PM"
    if (dateString.includes(' at ')) {
      const timePart = dateString.split(' at ')[1];
      return timePart; // Return the time part as-is
    }
    
    // Handle other time formats if needed
    return '';
  } catch (error) {
    console.error('Error extracting time:', error);
    return '';
  }
};

/**
 * Extract transaction ID from various formats
 */
const extractTransactionId = (data) => {
  // Check for transactionId field first
  if (data.transactionId) {
    return data.transactionId;
  }
  
  // Check for transaction_id field
  if (data.transaction_id) {
    return data.transaction_id;
  }
  
  // Check for reference_number field
  if (data.reference_number) {
    return data.reference_number;
  }
  
  // Check for ref field
  if (data.ref) {
    return data.ref;
  }
  
  // Look for "Transaction ID" pattern in text
  if (data.description || data.narration) {
    const text = (data.description || data.narration).toString();
    const match = text.match(/Transaction\s*ID\s*(\d+)/i);
    if (match) {
      return match[1];
    }
  }
  
  return '';
};

/**
 * Map multiple documents to table format
 * @param {Array} documents - Array of documents
 * @returns {Array} Array of mapped transactions
 */
export const mapDocumentsToTableFormat = (documents) => {
  if (!Array.isArray(documents)) {
    return [];
  }
  
  return documents.map(document => mapDocumentToTableFormat(document));
};

/**
 * Get table headers for the transaction table
 */
export const getTableHeaders = () => {
  return [
    { key: 'txnDate', label: 'Txn. Date', sortable: true },
    { key: 'time', label: 'Time', sortable: true },
    { key: 'transactionType', label: 'Transaction Type', sortable: true },
    { key: 'txnRefNo', label: 'Txn. Ref No.', sortable: true },
    { key: 'transactionId', label: 'Transaction ID', sortable: true },
    { key: 'senderName', label: 'Sender Name', sortable: true },
    { key: 'withdrawal', label: 'Withdrawal', sortable: true, type: 'currency' },
    { key: 'deposit', label: 'Deposit', sortable: true, type: 'currency' },
    { key: 'remitterBank', label: 'Remitter Bank', sortable: true },
    { key: 'sourceAccount', label: 'Source Account', sortable: true },
    { key: 'destinationAccount', label: 'Destination Account', sortable: true }
  ];
};

/**
 * Format currency values for display
 */
export const formatCurrency = (value) => {
  if (value === 0 || value === '0' || value === '') return '0.00';
  
  // Handle values with commas and text suffixes like "43,989,939.97 CR"
  let cleanValue = value.toString();
  
  // Remove text suffixes like "CR", "DR", etc.
  cleanValue = cleanValue.replace(/\s*(CR|DR|CREDIT|DEBIT)$/i, '');
  
  // Remove commas for parsing
  cleanValue = cleanValue.replace(/,/g, '');
  
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return '0.00';
  
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Export transactions to CSV format
 */
export const exportToCSV = (transactions, filename = 'transactions.csv') => {
  const headers = getTableHeaders();
  const csvHeaders = headers.map(h => h.label).join(',');
  
  const csvRows = transactions.map(transaction => {
    return headers.map(header => {
      let value = transaction[header.key] || '';
      
      // Format currency fields
      if (header.type === 'currency') {
        value = formatCurrency(value);
      }
      
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
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

/**
 * Generate reconciled report combining document data with Excel data
 */
export const generateReconciledReport = (syncResults, excelData) => {
  if (!syncResults || !syncResults.results || !excelData) {
    return [];
  }
  
  const reconciledData = [];
  
  // Process verified documents
  if (syncResults.results.verified) {
    syncResults.results.verified.forEach(verifiedItem => {
      const excelEntry = verifiedItem.matchedEntry;
      
      if (excelEntry) {
        // Map our document data to table format first
        const documentData = mapDocumentToTableFormat({
          id: verifiedItem.documentId,
          fileName: verifiedItem.fileName,
          extractedData: verifiedItem.documentData || {},
          documentType: verifiedItem.documentType || 'mobile_payment'
        });
        
        // Debug logging
        console.log('🔍 Reconciled Report Debug:', {
          documentId: verifiedItem.documentId,
          fileName: verifiedItem.fileName,
          documentData: verifiedItem.documentData,
          documentType: verifiedItem.documentType,
          mappedDocumentData: documentData,
          timeField: documentData.time,
          txnRefNoField: documentData.txnRefNo
        });
        
        const reconciledRow = {
          // Txn. Date - from our document
          txnDate: documentData.txnDate || '',
          // Transaction ID - from our document
          transactionId: documentData.transactionId || '',
          // Transaction Type - from Excel
          transactionType: excelEntry['Transaction Type'] || '',
          // Txn. Ref No. / Inst. / Voucher No. - from Excel
          txnRefNo: excelEntry['Txn. Ref No.'] || excelEntry['Inst. / Voucher No.'] || '',
          // Br. Name - from Excel
          branchName: excelEntry['Br. Name'] || '',
          // Narration / Transaction Detail - from Excel
          narration: excelEntry['Narration / Transaction Detail'] || '',
          // Balance - from Excel
          balance: excelEntry['Balance'] || '',
          // Sender Name - from our document
          senderName: documentData.senderName || '',
          // Withdrawal - from Excel
          withdrawal: excelEntry['Withdrawal'] || '',
          // Deposit - from Excel
          deposit: excelEntry['Deposit'] || '',
          // Remitter Bank - from Excel
          remitterBank: excelEntry['Remitter Bank'] || '',
          // Source Account - from Excel
          sourceAccount: excelEntry['Source Account'] || '',
          // Destination Account - from Excel
          destinationAccount: excelEntry['Destination Account'] || ''
        };
        
        reconciledData.push(reconciledRow);
      }
    });
  }
  
  return reconciledData;
};

/**
 * Export reconciled report to CSV
 */
export const exportReconciledReport = (syncResults, excelData, filename = 'reconciled_report.csv') => {
  const reconciledData = generateReconciledReport(syncResults, excelData);
  
  if (reconciledData.length === 0) {
    console.warn('No reconciled data to export');
    return;
  }
  
  // Define headers for reconciled report
  const headers = [
    'Txn. Date',
    'Transaction ID',
    'Transaction Type',
    'Txn. Ref No. / Inst. / Voucher No.',
    'Br. Name',
    'Narration / Transaction Detail',
    'Balance',
    'Sender Name',
    'Withdrawal',
    'Deposit',
    'Remitter Bank',
    'Source Account',
    'Destination Account'
  ];
  
  const csvHeaders = headers.join(',');
  
  const csvRows = reconciledData.map(row => {
    return headers.map(header => {
      // Map header to field name
      let fieldName = '';
      switch(header) {
        case 'Txn. Date': fieldName = 'txnDate'; break;
        case 'Transaction ID': fieldName = 'transactionId'; break;
        case 'Transaction Type': fieldName = 'transactionType'; break;
        case 'Txn. Ref No. / Inst. / Voucher No.': fieldName = 'txnRefNo'; break;
        case 'Br. Name': fieldName = 'branchName'; break;
        case 'Narration / Transaction Detail': fieldName = 'narration'; break;
        case 'Balance': fieldName = 'balance'; break;
        case 'Sender Name': fieldName = 'senderName'; break;
        case 'Withdrawal': fieldName = 'withdrawal'; break;
        case 'Deposit': fieldName = 'deposit'; break;
        case 'Remitter Bank': fieldName = 'remitterBank'; break;
        case 'Source Account': fieldName = 'sourceAccount'; break;
        case 'Destination Account': fieldName = 'destinationAccount'; break;
        default: fieldName = header.toLowerCase().replace(/[^a-z]/g, '');
      }
      
      let value = row[fieldName] || '';
      
      // Format currency fields
      if (header === 'Withdrawal' || header === 'Deposit' || header === 'Balance') {
        console.log('💰 Currency formatting debug:', {
          header,
          originalValue: value,
          formattedValue: formatCurrency(value)
        });
        value = formatCurrency(value);
      }
      
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    }).join(',');
  });
  
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
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

export default {
  mapDocumentToTableFormat,
  mapDocumentsToTableFormat,
  getTableHeaders,
  formatCurrency,
  exportToCSV,
  generateReconciledReport,
  exportReconciledReport
};
