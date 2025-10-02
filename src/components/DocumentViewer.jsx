import { useState, useEffect } from 'react';
import { getDocumentById } from '../firebase/documentService';
import { parseBankStatement, parseSoneriBankStatement } from '../utils/bankStatementParser';
import * as XLSX from 'xlsx';

const DocumentViewer = ({ documentId, onBack }) => {
  const [document, setDocument] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const docData = await getDocumentById(documentId);
      setDocument(docData);
      
      // Parse bank statement if it's a bank statement document
      if (docData?.documentType === 'bank_statement' && docData?.rawOcrText) {
        let parsed;
        if (docData.rawOcrText.includes('Soneri') || docData.rawOcrText.includes('Soneri Bank')) {
          parsed = parseSoneriBankStatement(docData.rawOcrText);
        } else {
          parsed = parseBankStatement(docData.rawOcrText);
        }
        setParsedData(parsed);
      }
    } catch (err) {
      setError('Failed to load document');
      console.error('Error loading document:', err);
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

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    const num = parseFloat(amount.toString().replace(/,/g, ''));
    return num.toLocaleString('en-PK', { minimumFractionDigits: 2 });
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

  const downloadDocumentAsExcel = () => {
    if (!document) return;

    // Prepare data for Excel export
    const excelData = {
      'Document ID': document.id,
      'File Name': document.fileName,
      'File Type': document.fileType,
      'File Size (Bytes)': document.fileSize,
      'Document Type': document.documentType,
      'Upload Date': formatDateForExcel(document.uploadedAt),
      'Processed Date': formatDateForExcel(document.processedAt)
    };

    // Add mobile payment specific data if available
    if (document.documentType === 'mobile_payment' && document.extractedData) {
      const paymentData = document.extractedData;
      Object.assign(excelData, {
        'Service Provider': paymentData.service || 'N/A',
        'Transaction ID': paymentData.transactionId || 'N/A',
        'Amount': paymentData.amount || 'N/A',
        'Currency': paymentData.currency || 'N/A',
        'Status': paymentData.status || 'N/A',
        'Date': paymentData.date || 'N/A',
        'Time': paymentData.time || 'N/A',
        'From Name': paymentData.fromName || 'N/A',
        'From Phone': paymentData.fromPhone || 'N/A',
        'From Account': paymentData.fromAccount || 'N/A',
        'To Name': paymentData.toName || 'N/A',
        'To Phone': paymentData.toPhone || 'N/A',
        'To Account': paymentData.toAccount || 'N/A',
        'Description': paymentData.description || 'N/A'
      });
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet([excelData]);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 20 }, { wch: 30 }
    ];
    ws['!cols'] = colWidths;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Document Details');
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${document.fileName}_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error || 'Document not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">

        {/* Document Info */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Document Information</h2>
              <button
                onClick={downloadDocumentAsExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">File Name</label>
                <p className="text-gray-900">{document.fileName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">File Type</label>
                <p className="text-gray-900">{document.fileType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">File Size</label>
                <p className="text-gray-900">{formatFileSize(document.fileSize)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Uploaded</label>
                <p className="text-gray-900">{formatDate(document.uploadedAt)}</p>
              </div>
            </div>
          </div>

          {/* Extracted Data */}
          {document.documentType === 'bank_statement' && parsedData ? (
            <div className="space-y-6">
              {/* Verification Status */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Bank Statement</h2>
                  {getVerificationBadge(document)}
                </div>
              </div>

              {/* Account Information */}
              {parsedData?.accountInfo && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(parsedData.accountInfo).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="font-medium text-gray-900">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {parsedData?.summary && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{parsedData.summary.totalTransactions}</p>
                      <p className="text-sm text-blue-800">Total Transactions</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">PKR {formatCurrency(parsedData.summary.totalDeposits)}</p>
                      <p className="text-sm text-green-800">Total Deposits</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">PKR {formatCurrency(parsedData.summary.totalWithdrawals)}</p>
                      <p className="text-sm text-red-800">Total Withdrawals</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">PKR {formatCurrency(parsedData.summary.finalBalance)}</p>
                      <p className="text-sm text-purple-800">Final Balance</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Statement Table */}
              {parsedData?.transactions && parsedData.transactions.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction Details</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Txn. Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Value Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Txn. Type
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Transaction Ref No. / Instrument / Voucher No.
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Br. Name
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Narration / Transaction Detail
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Withdrawal
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Deposit
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Balance
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Remitter Bank
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Source Account
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                            Destination Account
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedData.transactions.map((transaction, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                              {transaction.txnDate}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                              {transaction.valueDate}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                              {transaction.txnType}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 border-r border-gray-300 max-w-xs">
                              {transaction.transactionRef || 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 border-r border-gray-300 max-w-xs">
                              {transaction.branchName || 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 border-r border-gray-300 max-w-md">
                              <div className="max-w-xs truncate" title={transaction.narration}>
                                {transaction.narration || 'N/A'}
                              </div>
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-right">
                              {formatCurrency(transaction.withdrawal)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-right">
                              {formatCurrency(transaction.deposit)}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 text-right font-medium">
                              {formatCurrency(transaction.balance)}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 border-r border-gray-300 max-w-xs">
                              {transaction.remitterBank || 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 border-r border-gray-300 max-w-xs">
                              {transaction.sourceAccount || 'N/A'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900 max-w-xs">
                              {transaction.destinationAccount || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : document.documentType === 'mobile_payment' && document.extractedData?.data ? (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Receipt</h2>
                <div className="flex items-center gap-2">
                  {getVerificationBadge(document)}
                  <span className="text-sm text-gray-600">{document.extractedData.data.service}</span>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  {/* Hide Transaction ID for Meezan Bank */}
                  {document.extractedData.data.service !== 'Meezan Bank' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                      <div className="text-lg font-mono text-gray-900">{document.extractedData.data.transactionId}</div>
                    </div>
                  )}
                  
                  {/* Hide Date & Time for Meezan Bank */}
                  {document.extractedData.data.service !== 'Meezan Bank' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                      <div className="text-lg text-gray-900">
                        {document.extractedData.data.date} {document.extractedData.data.time && `at ${document.extractedData.data.time}`}
                      </div>
                    </div>
                  )}
                  
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="text-2xl font-bold text-green-600">
                      Rs. {document.extractedData.data.amount?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {document.extractedData.data.fee > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
                      <div className="text-lg text-gray-900">Rs. {document.extractedData.data.fee.toLocaleString()}</div>
                    </div>
                  )}
                  
                  {document.extractedData.data.totalAmount > 0 && (
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                      <div className="text-xl font-semibold text-gray-900">
                        Rs. {document.extractedData.data.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* From/To Information */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">From</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-gray-600">Name:</span>
                        <div className="font-medium text-gray-900">{document.extractedData.data.fromName || 'N/A'}</div>
                      </div>
                      {document.extractedData.data.fromPhone && (
                        <div>
                          <span className="text-sm text-gray-600">Phone:</span>
                          <div className="font-mono text-gray-900">{document.extractedData.data.fromPhone}</div>
                        </div>
                      )}
                      {document.extractedData.data.fromAccount && (
                        <div>
                          <span className="text-sm text-gray-600">Account:</span>
                          <div className="font-mono text-gray-900">{document.extractedData.data.fromAccount}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* To */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">To</h3>
                    <div className="space-y-2">
                <div>
                        <span className="text-sm text-gray-600">Name:</span>
                        <div className="font-medium text-gray-900">{document.extractedData.data.toName || 'N/A'}</div>
                </div>
                      {document.extractedData.data.toPhone && (
                <div>
                          <span className="text-sm text-gray-600">Phone:</span>
                          <div className="font-mono text-gray-900">{document.extractedData.data.toPhone}</div>
                </div>
                      )}
                      {document.extractedData.data.toAccount && (
                <div>
                          <span className="text-sm text-gray-600">Account:</span>
                          <div className="font-mono text-gray-900">{document.extractedData.data.toAccount}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Extracted Text</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {document.rawOcrText}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
