import { useState, useRef } from 'react';
import { parseReconciledReport, parseComparisonReport, matchReports } from '../utils/reportComparison';

const ComparisonScreen = () => {
  const [reconciledFile, setReconciledFile] = useState(null);
  const [comparisonFile, setComparisonFile] = useState(null);
  const [reconciledData, setReconciledData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [matchingResults, setMatchingResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  const reconciledFileRef = useRef(null);
  const comparisonFileRef = useRef(null);

  const handleReconciledFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setReconciledFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      const data = await parseReconciledReport(file);
      setReconciledData(data);
      console.log('Reconciled data parsed:', data);
    } catch (error) {
      console.error('Error parsing reconciled file:', error);
      setError('Error parsing reconciled file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComparisonFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setComparisonFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      const data = await parseComparisonReport(file);
      setComparisonData(data);
      console.log('Comparison data parsed:', data);
    } catch (error) {
      console.error('Error parsing comparison file:', error);
      setError('Error parsing comparison file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompareReports = async () => {
    if (!reconciledData || !comparisonData) {
      setError('Please upload both files before comparing');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const results = await matchReports(reconciledData, comparisonData);
      setMatchingResults(results);
      setShowResults(true);
      console.log('Matching results:', results);
    } catch (error) {
      console.error('Error comparing reports:', error);
      setError('Error comparing reports: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFiles = () => {
    setReconciledFile(null);
    setComparisonFile(null);
    setReconciledData(null);
    setComparisonData(null);
    setMatchingResults(null);
    setShowResults(false);
    setError(null);
    
    if (reconciledFileRef.current) {
      reconciledFileRef.current.value = '';
    }
    if (comparisonFileRef.current) {
      comparisonFileRef.current.value = '';
    }
  };

  const handleDownloadResults = () => {
    if (!matchingResults || !reconciledData) return;

    // Create a map of matched entries for quick lookup
    const matchedEntries = new Set();
    matchingResults.verified.forEach(match => {
      matchedEntries.add(match.reconciled);
    });

    // Create CSV content with matched status
    const headers = Object.keys(reconciledData[0]);
    const csvHeaders = [...headers, 'Matched'];
    
    const csvRows = reconciledData.map(entry => {
      const isMatched = matchedEntries.has(entry);
      return [...Object.values(entry), isMatched ? 'Matched' : 'Not Matched'];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'reconciled_report_with_matching_status.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFinalResults = () => {
    if (!matchingResults) return;

    // Create detailed comparison results CSV - ONLY VERIFIED MATCHES
    const headers = [
      'Reconciled Date',
      'Reconciled Name',
      'Reconciled Amount',
      'Transaction Type',
      'Transaction ID',
      'Comparison Date',
      'Comparison Name',
      'Comparison Amount',
      'Document Number',
      'Document Type',
      'Match Score',
      'Status'
    ];

    const csvRows = [];

    // Add ONLY verified matches
    matchingResults.verified.forEach(match => {
      match.comparison.forEach(compEntry => {
        csvRows.push([
          match.reconciled['Txn. Date'],
          match.reconciled['Sender Name'],
          match.reconciled['Deposit'] || match.reconciled['Withdrawal'],
          match.reconciled['Transaction Type'],
          match.reconciled['Transaction ID'],
          compEntry['Posting Date'],
          compEntry['Customer Account: Name 1'] || compEntry['Customer'],
          compEntry['Company Code Currency Value'],
          compEntry['Document Number'] || '',
          compEntry['Document Type'] || '',
          match.matchScore.toFixed(2),
          'Verified'
        ]);
      });
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
    link.setAttribute('download', 'verified_matches_only.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Comparison</h1>
        <p className="text-gray-600">
          Compare reconciled reports with external reports to verify transaction matches
        </p>
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

      {/* Upload Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Reconciled Report Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Reconciled Report</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${reconciledData ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-500">
                {reconciledData ? 'Loaded' : 'Not loaded'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV or XLSX File
              </label>
              <input
                ref={reconciledFileRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleReconciledFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isProcessing}
              />
            </div>

            {reconciledFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reconciledFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(reconciledFile.size)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setReconciledFile(null);
                      setReconciledData(null);
                      if (reconciledFileRef.current) reconciledFileRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {reconciledData && (
                  <div className="mt-2 text-xs text-gray-600">
                    {reconciledData.length} records loaded
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comparison Report Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">External Report</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${comparisonData ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-xs text-gray-500">
                {comparisonData ? 'Loaded' : 'Not loaded'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV or XLSX File
              </label>
              <input
                ref={comparisonFileRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={handleComparisonFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isProcessing}
              />
            </div>

            {comparisonFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{comparisonFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(comparisonFile.size)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setComparisonFile(null);
                      setComparisonData(null);
                      if (comparisonFileRef.current) comparisonFileRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {comparisonData && (
                  <div className="mt-2 text-xs text-gray-600">
                    {comparisonData.length} records loaded
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={handleCompareReports}
          disabled={!reconciledData || !comparisonData || isProcessing}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            (!reconciledData || !comparisonData || isProcessing)
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Comparing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Reports
            </>
          )}
        </button>

        <button
          onClick={handleClearFiles}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Results Modal */}
      {showResults && matchingResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Comparison Results</h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{matchingResults.verified.length}</div>
                  <div className="text-sm text-green-700">Verified Matches</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{matchingResults.unverified.length}</div>
                  <div className="text-sm text-red-700">Unverified</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">{matchingResults.partialMatches.length}</div>
                  <div className="text-sm text-yellow-700">Partial Matches</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-600">{matchingResults.noMatches.length}</div>
                  <div className="text-sm text-gray-700">No Matches</div>
                </div>
              </div>

              {/* Reconciled Data Table */}
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reconciled Report Data ({reconciledData.length} entries)
                </h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reconciledData.map((entry, index) => {
                          // Check if this entry is matched
                          const isMatched = matchingResults.verified.some(match => 
                            match.reconciled === entry
                          );
                          
                          return (
                            <tr key={index} className={isMatched ? 'bg-green-50' : 'bg-white'}>
                              <td className="px-4 py-3 text-sm text-gray-900">{entry['Txn. Date']}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{entry['Sender Name']}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{entry['Deposit'] || entry['Withdrawal']}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{entry['Transaction Type']}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isMatched 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {isMatched ? 'Matched' : 'Not Matched'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadResults}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Reconciled Report
                </button>
                <button
                  onClick={handleDownloadFinalResults}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Final Results
                </button>
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonScreen;
