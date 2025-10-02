import React from 'react';
import * as XLSX from 'xlsx';

const MobilePaymentResults = ({ paymentData, rawOcrText }) => {

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

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No payment data to display</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Payment Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={downloadExcel}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Excel
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
                <div className="font-medium text-gray-900">{paymentData.fromName || 'N/A'}</div>
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
                <div className="font-medium text-gray-900">{paymentData.toName || 'N/A'}</div>
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
    </div>
  );
};

export default MobilePaymentResults;
