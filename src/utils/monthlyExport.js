import * as XLSX from 'xlsx';

/**
 * Export monthly documents to Excel
 * @param {Array} documents - Array of document objects
 * @param {string} month - Selected month (e.g., "October 2024")
 * @param {string} userName - Name of the user
 */
export const exportMonthlyDocumentsToExcel = (documents, month, userName) => {
  if (!documents || documents.length === 0) {
    alert('No documents found for the selected month.');
    return;
  }

  // Prepare data for Excel export
  const excelData = documents.map((doc, index) => {
    const baseData = {
      'S.No': index + 1,
      'File Name': doc.fileName,
      'File Size (Bytes)': doc.fileSize,
      'Upload Date': formatDateForExcel(doc.uploadedAt),
      'Processed Date': formatDateForExcel(doc.processedAt),
      'Verification Status': doc.verificationStatus || 'Unverified'
    };

    // Add mobile payment specific data if available
    if (doc.documentType === 'mobile_payment' && doc.extractedData) {
      // Handle both nested (extractedData.data) and flat (extractedData) structures
      const paymentData = doc.extractedData.data || doc.extractedData;
      return {
        'S.No': index + 1,
        'File Name': doc.fileName,
        'File Size (Bytes)': doc.fileSize,
        'Upload Date': formatDateForExcel(doc.uploadedAt),
        'Processed Date': formatDateForExcel(doc.processedAt),
        'Service Provider': paymentData.service,
        'Transaction ID': paymentData.transactionId,
        'Amount': paymentData.amount,
        'Currency': paymentData.currency,
        'Transaction Date': paymentData.date,
        'Transaction Time': paymentData.time,
        'Sender Name': paymentData.fromName,
        'Sender Phone': paymentData.fromPhone,
        'Sender Account': paymentData.fromAccount,
        'Receiver Name': paymentData.toName,
        'Receiver Phone': paymentData.toPhone,
        'Receiver Account': paymentData.toAccount,
        'Description': paymentData.description,
        'Verification Status': doc.verificationStatus
      };
    }

    // For bank statements or other document types
    return baseData;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths for better readability
  const colWidths = [
    { wch: 5 },   // S.No
    { wch: 30 },  // File Name
    { wch: 15 },  // File Size
    { wch: 20 },  // Upload Date
    { wch: 20 },  // Processed Date
    { wch: 20 },  // Service Provider
    { wch: 25 },  // Transaction ID
    { wch: 15 },  // Amount
    { wch: 10 },  // Currency
    { wch: 15 },  // Transaction Date
    { wch: 15 },  // Transaction Time
    { wch: 20 },  // Sender Name
    { wch: 15 },  // Sender Phone
    { wch: 20 },  // Sender Account
    { wch: 20 },  // Receiver Name
    { wch: 15 },  // Receiver Phone
    { wch: 20 },  // Receiver Account
    { wch: 30 },  // Description
    { wch: 20 }   // Verification Status
  ];
  
  ws['!cols'] = colWidths;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  // Truncate sheet name to 31 characters (Excel limit)
  const sheetName = `${month} Documents`.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const safeMonth = month.replace(/\s+/g, '_');
  const filename = `${userName}_${safeMonth}_Documents_${timestamp}.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, filename);
};

/**
 * Format date for Excel export
 * @param {Object} timestamp - Firebase timestamp or Date object
 * @returns {string} Formatted date string
 */
const formatDateForExcel = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Get available months from documents
 * @param {Array} documents - Array of document objects
 * @returns {Array} Array of month strings
 */
export const getAvailableMonths = (documents) => {
  if (!documents || documents.length === 0) return [];
  
  const months = new Set();
  
  documents.forEach(doc => {
    try {
      const date = doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt);
      const monthYear = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      months.add(monthYear);
    } catch (error) {
      console.error('Error processing date:', error);
    }
  });
  
  // Sort months chronologically (newest first)
  return Array.from(months).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB - dateA;
  });
};

/**
 * Filter documents by month
 * @param {Array} documents - Array of document objects
 * @param {string} selectedMonth - Selected month string
 * @returns {Array} Filtered documents
 */
export const filterDocumentsByMonth = (documents, selectedMonth) => {
  if (!documents || !selectedMonth) return documents;
  
  return documents.filter(doc => {
    try {
      const date = doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt);
      const docMonthYear = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      return docMonthYear === selectedMonth;
    } catch (error) {
      console.error('Error filtering by month:', error);
      return false;
    }
  });
};

export default {
  exportMonthlyDocumentsToExcel,
  getAvailableMonths,
  filterDocumentsByMonth
};
