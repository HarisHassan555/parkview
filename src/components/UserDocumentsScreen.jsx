import { useState, useEffect } from 'react';
import { getUserDocuments, getDocumentById } from '../firebase/documentService';
import { getUserById } from '../firebase/userService';
import { exportMonthlyDocumentsToExcel, getAvailableMonths, filterDocumentsByMonth } from '../utils/monthlyExport';
import { syncWithUploadedExcel, getVerificationStats, clearVerificationStatus } from '../utils/syncUtility';
import SimpleExcelDropbox from './SimpleExcelDropbox';

const UserDocumentsScreen = ({ userId, onBackToUsers, onViewDocument }) => {
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [verificationStats, setVerificationStats] = useState(null);
  const [showSyncPopup, setShowSyncPopup] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [activeExcelFile, setActiveExcelFile] = useState(null);
  const [showExcelDropbox, setShowExcelDropbox] = useState(false);

  useEffect(() => {
    loadUserAndDocuments();
  }, [userId]);

  useEffect(() => {
    // Reload verification stats when month changes
    if (documents.length > 0) {
      loadVerificationStats();
    }
  }, [selectedMonth]);

  useEffect(() => {
    // Filter documents when status changes
    filterDocuments();
  }, [selectedStatus]);

  const loadUserAndDocuments = async () => {
    try {
      setLoading(true);
      const [userData, documentsData] = await Promise.all([
        getUserById(userId),
        getUserDocuments(userId)
      ]);
      
      setUser(userData);
      setDocuments(documentsData);
      setFilteredDocuments(documentsData);
      
      // Get available months
      const months = getAvailableMonths(documentsData);
      setAvailableMonths(months);
      
      // Set default to most recent month if available
      if (months.length > 0) {
        setSelectedMonth(months[0]);
      }
      
      // Load verification stats
      await loadVerificationStats();
    } catch (err) {
      setError('Failed to load user documents');
      console.error('Error loading user documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVerificationBadge = (document) => {
    const status = document.verificationStatus;
    
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Verified
          </span>
        );
      case 'not found':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Not Found
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unverified
          </span>
        );
    }
  };

  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'mobile_payment':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'bank_statement':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'mobile_payment':
        return 'Mobile Payment';
      case 'bank_statement':
        return 'Bank Statement';
      default:
        return 'Document';
    }
  };

  // Get account number or phone number from document (prioritizing sender/from)
  const getAccountOrPhone = (document) => {
    if (!document.extractedData) return 'N/A';
    
    // For mobile payment documents
    if (document.documentType === 'mobile_payment') {
      const data = document.extractedData.data || document.extractedData;
      // Prioritize sender/from account, then sender/from phone
      if (data.fromAccount) return data.fromAccount;
      if (data.fromPhone) return data.fromPhone;
      // Fallback to recipient info if sender info not available
      if (data.toAccount) return data.toAccount;
      if (data.toPhone) return data.toPhone;
    }
    
    // For bank statement documents
    if (document.documentType === 'bank_statement') {
      const data = document.extractedData.data || document.extractedData;
      if (data.accountNumber) return data.accountNumber;
      if (data.accountNo) return data.accountNo;
      if (data.accountInfo?.accountNumber) return data.accountInfo.accountNumber;
    }
    
    return 'N/A';
  };

  // Get amount from document
  const getAmount = (document) => {
    if (!document.extractedData) return 'N/A';
    
    // For mobile payment documents
    if (document.documentType === 'mobile_payment') {
      const data = document.extractedData.data || document.extractedData;
      if (data.amount) return `Rs. ${data.amount.toLocaleString()}`;
      if (data.totalAmount) return `Rs. ${data.totalAmount.toLocaleString()}`;
    }
    
    // For bank statement documents
    if (document.documentType === 'bank_statement') {
      const data = document.extractedData.data || document.extractedData;
      if (data.summary?.finalBalance) return `Rs. ${data.summary.finalBalance.toLocaleString()}`;
      if (data.balance) return `Rs. ${data.balance.toLocaleString()}`;
      if (data.amount) return `Rs. ${data.amount.toLocaleString()}`;
    }
    
    return 'N/A';
  };

  // Filter documents by month and status
  const filterDocuments = () => {
    let filtered = [...documents];

    // Filter by month if selected
    if (selectedMonth !== '') {
      filtered = filterDocumentsByMonth(documents, selectedMonth);
    }

    // Filter by verification status if selected
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => {
        if (selectedStatus === 'verified') {
          return doc.verificationStatus === 'verified';
        } else if (selectedStatus === 'not_found') {
          return doc.verificationStatus === 'not found';
        } else if (selectedStatus === 'unverified') {
          return !doc.verificationStatus || doc.verificationStatus === null;
        }
        return true;
      });
    }

    setFilteredDocuments(filtered);
  };

  // Handle month selection
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    filterDocuments();
  };

  // Handle monthly download
  const handleMonthlyDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Use filtered documents (includes both month and status filters)
      const documentsToExport = filteredDocuments;
      let exportName;
      
      if (!selectedMonth || selectedMonth === '') {
        exportName = 'All Documents';
      } else {
        exportName = selectedMonth;
      }
      
      // Add status filter info to export name if not showing all statuses
      if (selectedStatus !== 'all') {
        exportName += ` (${selectedStatus})`;
      }
      
      if (documentsToExport.length === 0) {
        alert('No documents found for the selected filters.');
        return;
      }
      
      await exportMonthlyDocumentsToExcel(documentsToExport, exportName, user?.name || 'Unknown User');
    } catch (error) {
      console.error('Error downloading monthly Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Excel file upload
  const handleExcelFileUpload = (fileData) => {
    setActiveExcelFile(fileData);
  };

  // Handle Excel file removal
  const handleExcelFileRemove = () => {
    setActiveExcelFile(null);
  };

  // Handle sync with uploaded Excel
  const handleSync = async () => {
    if (!activeExcelFile) {
      alert('Please upload an Excel file first before syncing.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('');
    
    try {
      const result = await syncWithUploadedExcel(activeExcelFile.data, selectedMonth);
      
      // Reload data to show updated verification status
      await loadUserAndDocuments();
      // Load verification stats with the selected month
      const stats = await getVerificationStats(selectedMonth);
      setVerificationStats(stats);
      
      // Show popup with result
      setSyncResult(result);
      setShowSyncPopup(true);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncResult({
        success: false,
        error: error.message
      });
      setShowSyncPopup(true);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load verification stats
  const loadVerificationStats = async () => {
    try {
      const stats = await getVerificationStats(selectedMonth);
      setVerificationStats(stats);
    } catch (error) {
      console.error('Error loading verification stats:', error);
    }
  };

  // Handle clear verification status
  const handleClearStatus = async () => {
    if (!window.confirm('Are you sure you want to clear all verification status from all documents? This action cannot be undone.')) {
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('Clearing verification status from all documents...');
    
    try {
      const result = await clearVerificationStatus();
      
      if (result.success) {
        setSyncStatus(`✅ Verification status cleared! Cleared: ${result.clearedCount} documents`);
        // Reload data to show updated status
        await loadUserAndDocuments();
        // Load verification stats with the selected month
        const stats = await getVerificationStats(selectedMonth);
        setVerificationStats(stats);
      } else {
        setSyncStatus(`❌ Clear failed: ${result.error}`);
      }
    } catch (error) {
      setSyncStatus(`❌ Error clearing status: ${error.message}`);
      console.error('Clear status error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadUserAndDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Centered Loader */}
      {isSyncing && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50" style={{pointerEvents: 'all'}}>
          <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg font-medium text-blue-600">
              Syncing with {activeExcelFile?.fileName || 'Excel file'}...
            </p>
            <p className="text-sm text-blue-500 mt-2">Please wait while we process your documents</p>
          </div>
        </div>
      )}

      {/* Sync Result Popup */}
      {showSyncPopup && syncResult && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              {syncResult.success ? (
                <>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">Sync Completed!</h3>
                  {syncResult.totalProcessed === 0 ? (
                    <p className="text-blue-800 mb-4">No documents found to sync.</p>
                  ) : (
                    <div className="text-blue-800 mb-4">
                      <p className="mb-2">Processed: {syncResult.totalProcessed} documents</p>
                      <p className="mb-2">Verified: {syncResult.verifiedCount}</p>
                      <p className="mb-2">Not Found: {syncResult.notFoundCount}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-red-600 mb-2">Sync Failed</h3>
                  <p className="text-red-500 mb-4">{syncResult.error}</p>
                </>
              )}
              <button
                onClick={() => setShowSyncPopup(false)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Month and Status Selector - HIDDEN */}
        {false && documents.length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Months</option>
                      {availableMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="not_found">Not Found</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Showing {filteredDocuments.length} of {documents.length} documents
                    {activeExcelFile && (
                      <span className="ml-2 text-green-600">
                        • Excel file loaded: {activeExcelFile.fileName}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Icons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExcelDropbox(!showExcelDropbox)}
                    className={`p-2 rounded-lg transition-colors ${
                      showExcelDropbox 
                        ? 'text-blue-600 bg-blue-100' 
                        : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
                    }`}
                    title="Upload Excel File"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <button
                    onClick={handleMonthlyDownload}
                    disabled={isDownloading || isSyncing}
                    className="p-2 text-blue-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`Download ${selectedMonth || 'All Documents'} Excel`}
                  >
                    {isDownloading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSync}
                    disabled={isSyncing || isDownloading || !activeExcelFile}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeExcelFile 
                        ? 'text-blue-400 hover:text-blue-500 hover:bg-blue-50' 
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={activeExcelFile ? `Sync ${selectedMonth || 'All Documents'} with uploaded Excel` : 'Upload an Excel file first'}
                  >
                    {isSyncing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Excel Dropbox */}
        {showExcelDropbox && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel Comparison File</h3>
                <p className="text-sm text-gray-600">
                  Upload an Excel file to enable real-time document comparison and syncing.
                </p>
              </div>
              
              <SimpleExcelDropbox
                onFileUpload={handleExcelFileUpload}
                onFileRemove={handleExcelFileRemove}
                currentFile={activeExcelFile}
                isUploading={isSyncing}
              />

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Upload Excel file with required columns</li>
                  <li>• Use sync button to compare documents</li>
                  <li>• Documents matching 3+ fields are verified</li>
                  <li>• Results show in document status</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Sync Status and Verification Stats */}
        {(syncStatus || verificationStats) && (
          <div className="mb-6">
            {syncStatus && (
              <div className={`p-4 rounded-lg mb-4 ${
                syncStatus.includes('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : syncStatus.includes('❌') 
                  ? 'bg-red-50 text-red-800' 
                  : 'bg-blue-50 text-blue-800'
              }`}>
                <p className="font-medium">{syncStatus}</p>
              </div>
            )}
            
            {/* Verification Statistics - HIDDEN */}
            {false && verificationStats && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Verification Statistics
                  {verificationStats.selectedMonth && verificationStats.selectedMonth !== 'all' && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      for {verificationStats.selectedMonth}
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{verificationStats.total}</div>
                    <div className="text-sm text-gray-600">Total Documents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{verificationStats.verified}</div>
                    <div className="text-sm text-gray-600">Verified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{verificationStats.notFound}</div>
                    <div className="text-sm text-gray-600">Not Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{verificationStats.unverified}</div>
                    <div className="text-sm text-gray-600">Unverified</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        <div>
          {documents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
              <p className="text-gray-600">
                This user hasn't uploaded any documents yet.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center min-w-[1000px]">
                  <div className="col-span-5 sm:col-span-4">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Document</h3>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Account No.</h3>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Amount</h3>
                  </div>
                  <div className="col-span-0 sm:col-span-2 hidden sm:block">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Uploaded</h3>
                  </div>
                  <div className="col-span-3 sm:col-span-3">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Status</h3>
                  </div>
                  <div className="col-span-0 sm:col-span-1 hidden sm:block">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">Actions</h3>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                     onClick={() => onViewDocument(document.id, document.fileName, document.documentType)}
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                          {getDocumentTypeIcon(document.documentType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {document.fileName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {getDocumentTypeLabel(document.documentType)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Account No.</div>
                          <div className="text-gray-900">{getAccountOrPhone(document)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Amount</div>
                          <div className="text-gray-900">{getAmount(document)}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="text-gray-500">Uploaded</div>
                        <div className="text-gray-900">{formatDate(document.uploadedAt)}</div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center min-w-[1000px]">
                        {/* Document Info */}
                        <div className="col-span-5 sm:col-span-4 flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                            {getDocumentTypeIcon(document.documentType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {document.fileName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {getDocumentTypeLabel(document.documentType)}
                            </p>
                          </div>
                        </div>

                        {/* Account No. */}
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-sm text-gray-900">{getAccountOrPhone(document)}</div>
                          <div className="text-xs text-gray-500">Account No.</div>
                        </div>

                        {/* Amount */}
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-sm text-gray-900">{getAmount(document)}</div>
                          <div className="text-xs text-gray-500">Amount</div>
                        </div>

                        {/* Upload Date */}
                        <div className="col-span-0 sm:col-span-2 hidden sm:block">
                          <div className="text-sm text-gray-900">{formatDate(document.uploadedAt)}</div>
                          <div className="text-xs text-gray-500">Uploaded</div>
                        </div>

                        {/* Status */}
                        <div className="col-span-3 sm:col-span-3">
                          <div className="flex items-center">
                            {getVerificationBadge(document)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-0 sm:col-span-1 hidden sm:block">
                          <div className="flex justify-center">
                            <span className="text-blue-600 text-sm font-medium">View</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    {/* <div className="mt-2 flex items-center text-blue-600 text-sm font-medium">
                      <span>Click to view document details</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div> */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDocumentsScreen;
