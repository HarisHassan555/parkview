// Sample bank statement data for testing the table display
export const sampleBankStatementData = {
  accountInfo: {
    accountNumber: '045820014169645',
    currency: 'PKR',
    accountType: 'Current Deposit Account Customer',
    fromDate: '12-Aug-2025',
    toDate: '20-Aug-2025',
    statementDate: '20-Aug-2025 03:30:09',
    page: '1 / 109',
    accountTitle: 'VISION DEVELOPERS PVT LTD',
    customerAddress: '55-C II GULBERG III LAHORE',
    bankName: 'Soneri Bank Limited',
    branchName: 'Park View City Branch-0458'
  },
  transactions: [
    {
      txnDate: '12-Aug-2025',
      valueDate: '12-Aug-2025',
      txnType: 'Balance Brought Forward',
      transactionRef: 'N/A',
      branchName: 'N/A',
      narration: 'Balance Brought Forward',
      withdrawal: 0,
      deposit: 0,
      balance: 55812779.70,
      remitterBank: 'N/A',
      sourceAccount: 'N/A',
      destinationAccount: 'N/A'
    },
    {
      txnDate: '12-Aug-2025',
      valueDate: '12-Aug-2025',
      txnType: 'RAAST Transfer',
      transactionRef: 'RAAST Transfer',
      branchName: 'Park View LHR BR.-0458',
      narration: 'RAAST Transfer-MPGP2P To: PK56MEZN0012480107124225-MEEZAN BANK AETMAD TRADERS ZAFARWAL Ref:57637570811215743-FT25224BSVLM',
      withdrawal: 0,
      deposit: 105908.00,
      balance: 55918687.70,
      remitterBank: 'MEEZAN BANK',
      sourceAccount: 'PK56MEZN0012480107124225',
      destinationAccount: 'PK46SONE0045820014169645'
    },
    {
      txnDate: '12-Aug-2025',
      valueDate: '12-Aug-2025',
      txnType: 'Incoming IBFT',
      transactionRef: 'Incoming IBFT',
      branchName: 'Soneri COK-9001',
      narration: 'Incoming IBFT-1Link Switch From: 03009770577-MMB QAISAR QAYOOM Ref:3738070811220033-FT25224J40T8',
      withdrawal: 0,
      deposit: 27258.00,
      balance: 55945945.70,
      remitterBank: 'MMB',
      sourceAccount: '03009770577',
      destinationAccount: 'PK46SONE0045820014169645'
    }
  ],
  summary: {
    totalTransactions: 3,
    totalDeposits: 133166.00,
    totalWithdrawals: 0,
    finalBalance: 55945945.70,
    netAmount: 133166.00
  }
}

export default sampleBankStatementData
