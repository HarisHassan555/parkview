import { useState, useEffect } from 'react'
import { parseBankStatement, parseSoneriBankStatement } from '../utils/bankStatementParser'

const ResultsScreen = ({ extractedData, uploadedFile, onBackToUpload }) => {
  const [parsedData, setParsedData] = useState(null)

  useEffect(() => {
    if (extractedData?.text) {
      
      // Try Soneri Bank parser first, then fallback to general parser
      let parsed
      if (extractedData.text.includes('Soneri') || extractedData.text.includes('Soneri Bank')) {
        parsed = parseSoneriBankStatement(extractedData.text)
      } else {
        parsed = parseBankStatement(extractedData.text)
      }
      setParsedData(parsed)
    }
  }, [extractedData])

  const formatCurrency = (amount) => {
    if (!amount) return '0.00'
    const num = parseFloat(amount.toString().replace(/,/g, ''))
    return num.toLocaleString('en-PK', { minimumFractionDigits: 2 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Document Processing Results
          </h1>
          <p className="text-lg text-gray-600">
            Parsed Bank Statement Data
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Unverified
            </span>
          </div>
        </header>

        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-6">
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

          {/* File Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">File Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">File Name:</p>
                <p className="font-medium text-gray-900">{uploadedFile?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Size:</p>
                <p className="font-medium text-gray-900">
                  {(uploadedFile?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">File Type:</p>
                <p className="font-medium text-gray-900">{uploadedFile?.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Processing Time:</p>
                <p className="font-medium text-gray-900">
                  {extractedData?.processingTime ? `${extractedData.processingTime}ms` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={onBackToUpload}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upload Another Document
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsScreen