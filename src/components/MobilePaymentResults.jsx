import React from 'react';
import * as XLSX from 'xlsx';

const MobilePaymentResults = ({ extractedData, uploadedFile, onBackToUpload }) => {
  // Handle both structured data and regular mobile payment data
  const paymentData = extractedData?.data || extractedData
  const rawOcrText = extractedData?.text || extractedData?.rawOcrText || ''

  const downloadExcel = () => {
    // Prepare data for Excel export - only include fields with actual data
    const excelData = {};
    
    // Always include these core fields
    if (paymentData.service) excelData['Service Provider'] = paymentData.service;
    if (paymentData.amount) excelData['Amount'] = paymentData.amount;
    if (paymentData.currency) excelData['Currency'] = paymentData.currency;
    if (paymentData.status) excelData['Status'] = paymentData.status;
    
    // Include transaction details only if available
    if (paymentData.transactionId) excelData['Transaction ID'] = paymentData.transactionId;
    if (paymentData.date) excelData['Date'] = paymentData.date;
    if (paymentData.time) excelData['Time'] = paymentData.time;
    
    // Include from details only if available
    if (paymentData.fromName) excelData['From Name'] = paymentData.fromName;
    if (paymentData.fromPhone) excelData['From Phone'] = paymentData.fromPhone;
    if (paymentData.fromAccount) excelData['From Account'] = paymentData.fromAccount;
    
    // Include to details only if available
    if (paymentData.toName) excelData['To Name'] = paymentData.toName;
    if (paymentData.toPhone) excelData['To Phone'] = paymentData.toPhone;
    if (paymentData.toAccount) excelData['To Account'] = paymentData.toAccount;
    
    // Include fee and total only if they exist and are greater than 0
    if (paymentData.fee && paymentData.fee > 0) excelData['Fee'] = paymentData.fee;
    if (paymentData.totalAmount && paymentData.totalAmount > 0) {
      excelData['Total Amount'] = paymentData.totalAmount;
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet([excelData]);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Receipt');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `payment_receipt_${timestamp}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
  };

  const downloadText = () => {
    // Prepare text content for download
    let textContent = 'PAYMENT RECEIPT\n';
    textContent += '================\n\n';
    
    // Always include these core fields
    if (paymentData.service) textContent += `Service Provider: ${paymentData.service}\n`;
    if (paymentData.amount) textContent += `Amount: ${paymentData.amount}\n`;
    if (paymentData.currency) textContent += `Currency: ${paymentData.currency}\n`;
    if (paymentData.status) textContent += `Status: ${paymentData.status}\n`;
    
    // Include transaction details only if available
    if (paymentData.transactionId) textContent += `Transaction ID: ${paymentData.transactionId}\n`;
    if (paymentData.date) textContent += `Date: ${paymentData.date}\n`;
    if (paymentData.time) textContent += `Time: ${paymentData.time}\n`;
    
    // Include from details only if available
    if (paymentData.fromName) textContent += `From Name: ${paymentData.fromName}\n`;
    if (paymentData.fromPhone) textContent += `From Phone: ${paymentData.fromPhone}\n`;
    if (paymentData.fromAccount) textContent += `From Account: ${paymentData.fromAccount}\n`;
    
    // Include to details only if available
    if (paymentData.toName) textContent += `To Name: ${paymentData.toName}\n`;
    if (paymentData.toPhone) textContent += `To Phone: ${paymentData.toPhone}\n`;
    if (paymentData.toAccount) textContent += `To Account: ${paymentData.toAccount}\n`;
    
    // Include fee and total only if they exist and are greater than 0
    if (paymentData.fee && paymentData.fee > 0) textContent += `Fee: ${paymentData.fee}\n`;
    if (paymentData.totalAmount && paymentData.totalAmount > 0) {
      textContent += `Total Amount: ${paymentData.totalAmount}\n`;
    }
    
    // Add raw OCR text if available
    if (rawOcrText) {
      textContent += '\n\nRAW OCR TEXT:\n';
      textContent += '==============\n';
      textContent += rawOcrText;
    }
    
    // Create blob and download
    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `payment_receipt_${timestamp}.txt`;
    
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No payment data to display</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={onBackToUpload}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Upload
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Transaction Receipt</h1>
              <div className="flex space-x-3">
                <button
                  onClick={downloadExcel}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download Excel
                </button>
                <button
                  onClick={downloadText}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Text
                </button>
              </div>
            </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unverified
          </span>
          <span className="text-sm text-gray-600">{paymentData.service}</span>
        </div>
      </div>


      {/* Transaction Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          {/* Hide Transaction ID for Meezan Bank */}
          {paymentData.service !== 'Meezan Bank' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <div className="text-lg font-mono text-gray-900">{paymentData.transactionId}</div>
            </div>
          )}
          
          {/* Hide Date & Time for Meezan Bank */}
          {paymentData.service !== 'Meezan Bank' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <div className="text-lg text-gray-900">
                {paymentData.date} {paymentData.time && `at ${paymentData.time}`}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="text-2xl font-bold text-green-600">
              Rs. {paymentData.amount?.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {paymentData.fee > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
              <div className="text-lg text-gray-900">Rs. {paymentData.fee.toLocaleString()}</div>
            </div>
          )}
          
          {paymentData.totalAmount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <div className="text-xl font-semibold text-gray-900">
                Rs. {paymentData.totalAmount.toLocaleString()}
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
                <div className="font-medium text-gray-900">{paymentData.fromName}</div>
              </div>
              {paymentData.fromPhone && (
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <div className="font-mono text-gray-900">{paymentData.fromPhone}</div>
                </div>
              )}
              {paymentData.fromAccount && (
                <div>
                  <span className="text-sm text-gray-600">Account:</span>
                  <div className="font-mono text-gray-900">{paymentData.fromAccount}</div>
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
                <div className="font-medium text-gray-900">{paymentData.toName}</div>
              </div>
              {paymentData.toPhone && (
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <div className="font-mono text-gray-900">{paymentData.toPhone}</div>
                </div>
              )}
              {paymentData.toAccount && (
                <div>
                  <span className="text-sm text-gray-600">Account:</span>
                  <div className="font-mono text-gray-900">{paymentData.toAccount}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div className="border-t pt-4 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-600">Service Provider:</span>
            <div className="font-medium text-gray-900">{paymentData.service}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Currency:</span>
            <div className="font-medium text-gray-900">{paymentData.currency}</div>
          </div>
        </div>
      </div>

      {/* File Information */}
      {uploadedFile && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">File Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">File Name:</p>
              <p className="font-medium text-gray-900">{uploadedFile.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">File Size:</p>
              <p className="font-medium text-gray-900">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">File Type:</p>
              <p className="font-medium text-gray-900">{uploadedFile.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Processing Time:</p>
              <p className="font-medium text-gray-900">
                {extractedData?.processingTime ? `${extractedData.processingTime}ms` : null}
              </p>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default MobilePaymentResults;
