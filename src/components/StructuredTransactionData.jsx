import { useState } from 'react'

const StructuredTransactionData = ({ structuredData, rawText }) => {
  const [activeTab, setActiveTab] = useState('structured')

  if (!structuredData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Transaction Data</h3>
        <div className="text-gray-600">
          <p>No structured data available. Raw text:</p>
          <pre className="mt-2 p-3 bg-white border rounded text-sm overflow-auto max-h-40">
            {rawText}
          </pre>
        </div>
      </div>
    )
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return 'Not found'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return value.toString()
  }

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'mobile_payment': return 'bg-green-100 text-green-800'
      case 'bank_transfer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('structured')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'structured'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Structured Data
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'raw'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Raw Text
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'structured' ? (
          <div className="space-y-6">
            {/* Transaction Type */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Transaction Type:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionTypeColor(structuredData.transaction_type)}`}>
                {structuredData.transaction_type}
              </span>
            </div>

            {/* Sender Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Sender Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.sender?.name)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID/Account</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.sender?.id)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.sender?.phone)}</p>
                </div>
              </div>
            </div>

            {/* Receiver Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Receiver Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.receiver?.name)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ID/Account</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.receiver?.id)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.receiver?.phone)}</p>
                </div>
              </div>
            </div>

            {/* Amount Information */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Transaction Amount
              </h4>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</label>
                  <p className="text-2xl font-bold text-green-600">
                    {structuredData.amount?.value ? `${structuredData.amount.value}` : 'Not found'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currency</label>
                  <p className="text-lg font-medium text-gray-900">
                    {structuredData.amount?.currency || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Transaction Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.transaction_details?.date)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.transaction_details?.time)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transaction ID</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">{formatValue(structuredData.transaction_details?.transaction_id)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.transaction_details?.service)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                  <p className="text-sm text-gray-900 mt-1">{formatValue(structuredData.transaction_details?.status)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Raw Extracted Text</h4>
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {rawText}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default StructuredTransactionData
