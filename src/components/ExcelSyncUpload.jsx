import React, { useState } from 'react';
import { analyzeBankStatementExcel, compareDocumentWithExcelFlexible } from '../utils/excelAnalyzer';
import { syncWithUploadedExcel } from '../utils/syncUtility';
import { getVerificationStats } from '../utils/syncUtility';

const ExcelSyncUpload = ({ onSyncComplete }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [syncResults, setSyncResults] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setExcelFile(file);
    setError(null);
    setIsAnalyzing(true);

    try {
      // Read the Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setExcelData(jsonData);
      setAnalysisResults({
        fileName: file.name,
        totalRows: jsonData.length,
        sampleRow: jsonData[0] || {},
        availableFields: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
      });

      console.log('📊 Excel File Loaded:', {
        fileName: file.name,
        totalRows: jsonData.length,
        fields: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
      });

    } catch (error) {
      console.error('❌ Error reading Excel file:', error);
      setError(`Error reading Excel file: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSync = async () => {
    if (!excelData) {
      setError('Please upload an Excel file first');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      console.log('🔄 Starting sync process...');
      const results = await syncWithUploadedExcel(excelData, selectedMonth);
      
      setSyncResults(results);
      
      if (results.success) {
        console.log('✅ Sync completed successfully:', results);
        if (onSyncComplete) {
          onSyncComplete(results);
        }
      } else {
        setError(`Sync failed: ${results.error}`);
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setError(`Sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const getMonthOptions = () => {
    const months = [
      { value: 'all', label: 'All Months' },
      { value: 'January 2024', label: 'January 2024' },
      { value: 'February 2024', label: 'February 2024' },
      { value: 'March 2024', label: 'March 2024' },
      { value: 'April 2024', label: 'April 2024' },
      { value: 'May 2024', label: 'May 2024' },
      { value: 'June 2024', label: 'June 2024' },
      { value: 'July 2024', label: 'July 2024' },
      { value: 'August 2024', label: 'August 2024' },
      { value: 'September 2024', label: 'September 2024' },
      { value: 'October 2024', label: 'October 2024' },
      { value: 'November 2024', label: 'November 2024' },
      { value: 'December 2024', label: 'December 2024' },
      { value: 'January 2025', label: 'January 2025' },
      { value: 'February 2025', label: 'February 2025' },
      { value: 'March 2025', label: 'March 2025' },
      { value: 'April 2025', label: 'April 2025' },
      { value: 'May 2025', label: 'May 2025' },
      { value: 'June 2025', label: 'June 2025' },
      { value: 'July 2025', label: 'July 2025' },
      { value: 'August 2025', label: 'August 2025' },
      { value: 'September 2025', label: 'September 2025' },
      { value: 'October 2025', label: 'October 2025' },
      { value: 'November 2025', label: 'November 2025' },
      { value: 'December 2025', label: 'December 2025' }
    ];
    return months;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Excel Sync Upload</h2>
        <p className="text-gray-600">
          Upload your bank statement Excel file to sync and verify documents
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Excel File
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={isAnalyzing}
        />
        {isAnalyzing && (
          <div className="mt-2 flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Analyzing Excel file...
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Bank Statement Analysis Complete</h3>
          <div className="text-sm text-green-700 space-y-2">
            <p><strong>File:</strong> {analysisResults.fileName}</p>
            <p><strong>Total Rows:</strong> {analysisResults.totalRows}</p>
            <p><strong>Available Fields:</strong> {analysisResults.availableFields.join(', ')}</p>
            
            {/* Show sample row for verification */}
            {analysisResults.sampleRow && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="font-medium text-gray-800 mb-2">Sample Transaction:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(analysisResults.sampleRow).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span className="text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Month Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month to Sync
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={!excelData || isSyncing}
        >
          {getMonthOptions().map(month => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sync Button */}
      <div className="mb-6">
        <button
          onClick={handleSync}
          disabled={!excelData || isSyncing}
          className={`w-full py-3 px-4 rounded-md font-medium ${
            !excelData || isSyncing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isSyncing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Syncing Documents...
            </div>
          ) : (
            'Start Sync Process'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Results */}
      {syncResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Sync Results</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Total Processed:</strong> {syncResults.totalProcessed}</p>
            <p><strong>Verified:</strong> {syncResults.verifiedCount}</p>
            <p><strong>Not Found:</strong> {syncResults.notFoundCount}</p>
            <p><strong>Selected Month:</strong> {syncResults.selectedMonth}</p>
          </div>
          
          {syncResults.verifiedCount > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Successfully Verified Documents:</h4>
              <div className="text-sm text-green-700 space-y-2">
                {syncResults.results.verified.map((item, index) => (
                  <div key={index} className="bg-green-100 p-3 rounded border">
                    <div className="flex items-center mb-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="font-medium">{item.fileName}</span>
                    </div>
                    {item.matchedEntry && item.matchedEntry.matchDetails && (
                      <div className="text-xs text-green-600 ml-4">
                        <div className="font-medium mb-1">Match Details:</div>
                        <div className="space-y-1">
                          {item.matchedEntry.matchDetails.matches.map((match, matchIndex) => (
                            <div key={matchIndex} className="flex justify-between">
                              <span>{match.field}:</span>
                              <span className="font-mono">{match.docValue} → {match.excelValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {syncResults.notFoundCount > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-orange-800 mb-2">⚠️ Documents Not Found in Excel:</h4>
              <div className="text-sm text-orange-700">
                {syncResults.results.notFound.map((item, index) => (
                  <div key={index} className="flex items-center mb-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    {item.fileName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelSyncUpload;
