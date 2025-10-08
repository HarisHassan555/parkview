# Excel Sync Feature Guide

## Overview
The Excel Sync feature allows you to upload a bank statement Excel file and automatically verify your uploaded documents against the data in the Excel file.

## How It Works

### 1. Upload Excel File
- Navigate to the "Excel Sync" tab in the application
- Upload your bank statement Excel file (.xlsx or .xls format)
- The system will analyze the file structure and show available fields

### 2. Select Month to Sync
- Choose which month's documents you want to verify
- You can select "All Months" to verify all documents

### 3. Start Sync Process
- Click "Start Sync Process" to begin verification
- The system will compare each uploaded document with entries in your Excel file
- Documents that match will be marked as "verified"
- Documents that don't match will be marked as "not found"

## Bank Statement Field Matching

The system uses bank statement specific logic to compare documents with Excel data:

### Bank Statement Columns (Exact Names)
The Excel file will always have these exact column names:
- **Txn. Date**: Transaction date
- **Value Date**: Value date  
- **Transaction Type**: Type of transaction (e.g., RAAST Transfer)
- **Txn. Ref No. / Inst. / Voucher No.**: Transaction reference number
- **Br. Name**: Branch name
- **Narration / Transaction Detail**: Detailed transaction description
- **Withdrawal**: Withdrawal amount
- **Deposit**: Deposit amount (used for amount matching)
- **Balance**: Account balance
- **Remitter Bank**: Bank name
- **Source Account**: Source account number (used for account matching)
- **Destination Account**: Destination account number

### Matching Logic
The system performs the following comparisons:

1. **Amount Matching**: 
   - Compares document amount with `Deposit` column ONLY
   - Uses exact numeric matching (ignores currency symbols)
   - Ignores `Withdrawal` column completely

2. **Account Number Matching**:
   - Compares document sender account with `Source Account` column ONLY
   - Exact string matching for account numbers
   - Ignores `Destination Account` column

3. **Name Matching**:
   - Extracts sender name from `Narration / Transaction Detail` column
   - Performs case-insensitive substring matching
   - Ignores receiver name completely

### Success Criteria (FLEXIBLE VERIFICATION)
- **ANY 2 of 3 conditions** must be met for verification:
  1. **Amount Match**: Document amount must exactly match Excel Deposit column
  2. **Account Match**: Document sender account must exactly match Excel Source Account
  3. **Name Match**: Document sender name must be found in Excel Narration/Transaction Detail
- **If fewer than 2 conditions match**: Document is marked as "Not Found"

## Excel File Format

Your Excel file should contain columns with transaction data. The system will automatically detect common field names:

### Common Field Names
- Amount: "Amount", "amount", "AMOUNT"
- Service: "Service", "service", "SERVICE", "Bank", "bank"
- From Name: "From Name", "from_name", "FROM_NAME", "Sender", "sender"
- To Name: "To Name", "to_name", "TO_NAME", "Receiver", "receiver"
- Transaction ID: "Transaction ID", "transaction_id", "TRANSACTION_ID", "Ref", "ref", "Reference"
- Date: "Date", "date", "DATE", "Transaction Date", "transaction_date"

## Results

After sync completion, you'll see:
- **Total Processed**: Number of documents checked
- **Verified**: Number of documents that matched Excel entries
- **Not Found**: Number of documents that didn't match any Excel entries
- **Successfully Verified Documents**: List of verified documents
- **Documents Not Found in Excel**: List of documents that couldn't be matched

## Verification Status

Documents will be updated with verification status:
- **verified**: Document matches an entry in the Excel file
- **not found**: Document doesn't match any Excel entry
- **unverified**: Document hasn't been checked yet

## Troubleshooting

### No Matches Found
- Check that your Excel file has the correct field names
- Ensure the data format matches (e.g., dates, amounts)
- Verify that the document data was extracted correctly

### Partial Matches
- The system requires at least 3 field matches
- Check for typos or formatting differences
- Ensure phone numbers and account numbers match exactly

### Excel File Issues
- Make sure the file is in .xlsx or .xls format
- Check that the first row contains column headers
- Ensure the data is in the first worksheet

## Best Practices

1. **Consistent Data**: Keep your Excel data consistent with document formats
2. **Regular Updates**: Sync regularly to keep verification status current
3. **Field Mapping**: Use standard field names for better matching
4. **Data Quality**: Ensure Excel data is clean and properly formatted

## Technical Details

- Uses XLSX library for Excel file parsing
- Implements flexible field matching algorithm
- Stores verification results in Firebase
- Supports batch processing for large datasets
- Provides detailed logging for debugging
