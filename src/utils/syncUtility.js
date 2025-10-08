import * as XLSX from 'xlsx';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase/services.js';
import { compareDocumentWithExcelFlexible } from './excelAnalyzer.js';

/**
 * Read and parse the uploaded Excel file
 */
const readUploadedExcel = async (excelData) => {
  try {
    if (!excelData || !Array.isArray(excelData)) {
      throw new Error('No Excel data provided');
    }
    
    return excelData;
  } catch (error) {
    console.error('❌ Error reading uploaded Excel file:', error);
    throw error;
  }
};

/**
 * Compare document with Excel entry
 * Returns true if at least 3 fields match exactly
 */
const compareDocumentWithExcel = (document, excelEntry) => {
  if (!document.extractedData || document.documentType !== 'mobile_payment') {
    return false;
  }
  
  const paymentData = document.extractedData;
  let matchCount = 0;
  
  // Define comparison fields and their mappings
  const comparisonFields = [
    {
      docField: 'amount',
      excelField: 'Amount',
      type: 'number'
    },
    {
      docField: 'service',
      excelField: 'Service',
      type: 'string'
    },
    {
      docField: 'fromName',
      excelField: 'From Name',
      type: 'string'
    },
    {
      docField: 'toName',
      excelField: 'To Name',
      type: 'string'
    },
    {
      docField: 'fromPhone',
      excelField: 'From Phone',
      type: 'string'
    },
    {
      docField: 'toPhone',
      excelField: 'To Phone',
      type: 'string'
    },
    {
      docField: 'transactionId',
      excelField: 'Transaction ID',
      type: 'string'
    },
    {
      docField: 'date',
      excelField: 'Date',
      type: 'string'
    }
  ];
  
  // Check each field for exact matches
  for (const field of comparisonFields) {
    const docValue = paymentData[field.docField];
    const excelValue = excelEntry[field.excelField];
    
    if (docValue && excelValue) {
      let isMatch = false;
      
      if (field.type === 'number') {
        // Exact number comparison
        const docNum = parseFloat(docValue.toString().replace(/[^\d.-]/g, ''));
        const excelNum = parseFloat(excelValue.toString().replace(/[^\d.-]/g, ''));
        isMatch = !isNaN(docNum) && !isNaN(excelNum) && docNum === excelNum;
      } else {
        // Exact string comparison (case sensitive, exact match)
        const docStr = docValue.toString().trim();
        const excelStr = excelValue.toString().trim();
        isMatch = docStr === excelStr;
      }
      
      if (isMatch) {
        matchCount++;
      }
    }
  }
  
  return matchCount >= 3;
};

/**
 * Find matching Excel entry for a document using flexible field matching
 */
const findMatchingExcelEntry = (document, excelData) => {
  for (const excelEntry of excelData) {
    const comparison = compareDocumentWithExcelFlexible(document, excelEntry);
    if (comparison.isMatch) {
      return {
        ...excelEntry,
        matchDetails: comparison
      };
    }
  }
  return null;
};

/**
 * Update document with verification status
 */
const updateDocumentVerification = async (documentId, status, matchedEntry = null) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      verificationStatus: status,
      verifiedAt: new Date(),
      matchedEntry: matchedEntry
    });
  } catch (error) {
    console.error(`❌ Error updating document ${documentId}:`, error);
    throw error;
  }
};

/**
 * Filter documents by month
 */
const filterDocumentsByMonth = (documents, selectedMonth) => {
  if (!selectedMonth || selectedMonth === 'all') {
    return documents;
  }
  
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

/**
 * Main sync function
 */
export const syncWithUploadedExcel = async (excelData, selectedMonth = null) => {
  try {
    
    // Read Excel file
    const excelDataParsed = await readUploadedExcel(excelData);
    
    // Get all documents
    const documentsRef = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsRef);
    const allDocuments = [];
    
    documentsSnapshot.forEach((doc) => {
      allDocuments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filter documents by selected month
    const documents = filterDocumentsByMonth(allDocuments, selectedMonth);
    
    
    if (documents.length === 0) {
      return {
        success: true,
        verifiedCount: 0,
        notFoundCount: 0,
        totalProcessed: 0,
        message: `No documents found for the selected month: ${selectedMonth}`
      };
    }
    
    let verifiedCount = 0;
    let notFoundCount = 0;
    const results = {
      verified: [],
      notFound: []
    };
    
    // Process each document
    for (const document of documents) {
      try {
        const matchedEntry = findMatchingExcelEntry(document, excelDataParsed);
        
        if (matchedEntry) {
          await updateDocumentVerification(document.id, 'verified', matchedEntry);
          results.verified.push({
            documentId: document.id,
            fileName: document.fileName,
            documentData: document.extractedData, // Include document data
            documentType: document.documentType, // Include document type
            matchedEntry: matchedEntry,
            matchDetails: matchedEntry.matchDetails || null,
            matchedFields: matchedEntry.matchDetails?.matches || []
          });
          verifiedCount++;
        } else {
          await updateDocumentVerification(document.id, 'not found');
          results.notFound.push({
            documentId: document.id,
            fileName: document.fileName,
            reason: 'No matching criteria met (need 3 of 5 conditions)'
          });
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing document ${document.id}:`, error);
      }
    }
    
    
    return {
      success: true,
      verifiedCount,
      notFoundCount,
      totalProcessed: documents.length,
      selectedMonth,
      results
    };
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Remove verification status from all documents
 */
export const clearVerificationStatus = async () => {
  try {
    
    // Get all documents
    const documentsRef = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsRef);
    
    let clearedCount = 0;
    let errorCount = 0;
    
    // Process each document
    for (const documentSnapshot of documentsSnapshot.docs) {
      try {
        const docRef = doc(db, 'documents', documentSnapshot.id);
        await updateDoc(docRef, {
          verificationStatus: null,
          verifiedAt: null,
          matchedEntry: null
        });
        clearedCount++;
      } catch (error) {
        errorCount++;
        console.error(`❌ Error clearing document ${documentSnapshot.id}:`, error);
      }
    }
    
    
    return {
      success: true,
      clearedCount,
      errorCount,
      totalProcessed: documentsSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error clearing verification status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get verification statistics for a specific month
 */
export const getVerificationStats = async (selectedMonth = null) => {
  try {
    const documentsRef = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsRef);
    
    const stats = {
      total: 0,
      verified: 0,
      notFound: 0,
      unverified: 0,
      selectedMonth: selectedMonth
    };
    
    documentsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter by month if specified
      if (selectedMonth && selectedMonth !== 'all') {
        try {
          const date = data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt);
          const docMonthYear = date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          });
          
          if (docMonthYear !== selectedMonth) {
            return; // Skip this document if it doesn't match the selected month
          }
        } catch (error) {
          console.error('Error processing document date:', error);
          return; // Skip this document if date processing fails
        }
      }
      
      stats.total++;
      
      if (data.verificationStatus === 'verified') {
        stats.verified++;
      } else if (data.verificationStatus === 'not found') {
        stats.notFound++;
      } else {
        stats.unverified++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting verification stats:', error);
    return null;
  }
};

// Keep the old function for backward compatibility
export const syncWithOctoberExcel = async (selectedMonth = null) => {
  console.warn('⚠️ syncWithOctoberExcel is deprecated. Use syncWithUploadedExcel with uploaded file data instead.');
  throw new Error('This function is deprecated. Please upload an Excel file and use syncWithUploadedExcel instead.');
};

export default {
  syncWithUploadedExcel,
  syncWithOctoberExcel, // Keep for backward compatibility
  getVerificationStats,
  clearVerificationStatus
};
