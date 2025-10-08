import * as XLSX from 'xlsx';

/**
 * Analyze the BankStatementNew.xlsx file structure
 * This function can be called from browser console to understand the Excel file
 */
export const analyzeExcelFile = async () => {
  try {
    console.log('🔍 Analyzing BankStatementNew.xlsx file...');
    
    // Try to fetch the file from the public directory
    const response = await fetch('/src/utils/BankStatementNew.xlsx');
    
    if (!response.ok) {
      console.log('❌ Could not fetch Excel file. Make sure the file is in the correct location.');
      return {
        success: false,
        error: 'File not found or not accessible'
      };
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    console.log('📊 Excel File Analysis Results:');
    console.log('Sheet Names:', workbook.SheetNames);
    
    const results = {
      success: true,
      sheetNames: workbook.SheetNames,
      sheets: {}
    };
    
    // Analyze each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`\n📋 Sheet: ${sheetName}`);
      console.log(`Total Rows: ${jsonData.length}`);
      
      if (jsonData.length > 0) {
        console.log('Sample Row:', jsonData[0]);
        console.log('Available Fields:', Object.keys(jsonData[0]));
        
        results.sheets[sheetName] = {
          totalRows: jsonData.length,
          sampleRow: jsonData[0],
          availableFields: Object.keys(jsonData[0]),
          allData: jsonData
        };
      } else {
        console.log('⚠️ No data found in this sheet');
        results.sheets[sheetName] = {
          totalRows: 0,
          sampleRow: null,
          availableFields: [],
          allData: []
        };
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get field mapping suggestions based on Excel data
 */
export const getFieldMappingSuggestions = (excelData) => {
  if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
    return null;
  }
  
  const sampleRow = excelData[0];
  const availableFields = Object.keys(sampleRow);
  
  console.log('🔍 Field Mapping Suggestions:');
  console.log('Available Excel Fields:', availableFields);
  
  const suggestions = {
    amount: availableFields.filter(field => 
      field.toLowerCase().includes('amount') || 
      field.toLowerCase().includes('value') ||
      field.toLowerCase().includes('total')
    ),
    service: availableFields.filter(field => 
      field.toLowerCase().includes('service') || 
      field.toLowerCase().includes('bank') ||
      field.toLowerCase().includes('provider')
    ),
    fromName: availableFields.filter(field => 
      field.toLowerCase().includes('from') && field.toLowerCase().includes('name') ||
      field.toLowerCase().includes('sender') ||
      field.toLowerCase().includes('payer')
    ),
    toName: availableFields.filter(field => 
      field.toLowerCase().includes('to') && field.toLowerCase().includes('name') ||
      field.toLowerCase().includes('receiver') ||
      field.toLowerCase().includes('payee')
    ),
    transactionId: availableFields.filter(field => 
      field.toLowerCase().includes('transaction') ||
      field.toLowerCase().includes('reference') ||
      field.toLowerCase().includes('ref') ||
      field.toLowerCase().includes('id')
    ),
    date: availableFields.filter(field => 
      field.toLowerCase().includes('date') ||
      field.toLowerCase().includes('time')
    ),
    phone: availableFields.filter(field => 
      field.toLowerCase().includes('phone') ||
      field.toLowerCase().includes('mobile') ||
      field.toLowerCase().includes('contact')
    )
  };
  
  console.log('Suggested Mappings:', suggestions);
  return suggestions;
};

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  window.analyzeExcelFile = analyzeExcelFile;
  window.getFieldMappingSuggestions = getFieldMappingSuggestions;
}

export default {
  analyzeExcelFile,
  getFieldMappingSuggestions
};
