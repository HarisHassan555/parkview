import { compareDocumentWithExcelFlexible } from './excelAnalyzer.js';

/**
 * Debug utility to test document matching with Excel data
 */
export const debugDocumentMatching = (document, excelEntry) => {
  console.log('🔍 Starting document matching debug...');
  console.log('📄 Document:', {
    id: document.id,
    fileName: document.fileName,
    documentType: document.documentType,
    extractedData: document.extractedData
  });
  
  console.log('📊 Excel Entry:', excelEntry);
  
  const result = compareDocumentWithExcelFlexible(document, excelEntry);
  
  console.log('🎯 Matching Result:', result);
  
  return result;
};

/**
 * Test with sample data
 */
export const testWithSampleData = () => {
  const sampleDocument = {
    id: 'test-doc-1',
    fileName: 'test-document.pdf',
    documentType: 'mobile_payment',
    extractedData: {
      data: {
        amount: 33361,
        fromName: 'UJALA NASHEEN',
        fromAccount: 'PK31MEZN0002930101935604',
        toName: 'VISION DEVELOPERS PVT LTD',
        toAccount: 'PK*****9645',
        transactionId: '843039',
        service: 'MEEZAN BANK'
      }
    }
  };
  
  const sampleExcelEntry = {
    'Txn. Date': '10-Sep-25',
    'Value Date': '10-Sep-25',
    'Transaction Type': 'RAAST Transfer',
    'Txn. Ref No. / Inst. / Voucher No.': 'RAAST Transfer',
    'Br. Name': 'Park View LHR BR.-0458',
    'Narration / Transaction Detail': 'RAAST Transfer-MPGP2P To: PK31MEZN0002930101935604-MEEZAN BANK UJALA NASHEEN Ref:302454470910063024-FT25253Z044M',
    'Withdrawal': '0',
    'Deposit': '33,361',
    'Balance': '31,104,951.97 CR',
    'Remitter Bank': 'MEEZAN BANK',
    'Source Account': 'PK31MEZN0002930101935604',
    'Destination Account': 'PK46SONE0045820014169645'
  };
  
  console.log('🧪 Testing with sample data...');
  return debugDocumentMatching(sampleDocument, sampleExcelEntry);
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.debugDocumentMatching = debugDocumentMatching;
  window.testWithSampleData = testWithSampleData;
}

export default {
  debugDocumentMatching,
  testWithSampleData
};
