# Parkview Housing Society - Document Upload Portal

A React application built with Vite and Tailwind CSS that allows residents to upload documents and automatically extracts data using OCR technology.

## Features

- **Document Upload**: Drag and drop or click to upload images (JPG, PNG) and PDF documents
- **AI-Powered Text Extraction**: Advanced text extraction using Google Gemini API
- **Unified Transaction Layout**: All transactions use a clean, mobile payment-style interface
- **Structured Data Extraction**: AI-powered extraction of sender, receiver, amounts, and transaction details
- **Customer Management**: View and manage resident profiles
- **Data Export**: Download transaction data as Excel or text files

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **AI Service**: Google Gemini API for intelligent text extraction
- **File Support**: JPG, PNG, PDF (up to 20MB)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### For Housing Society Administrators

1. **Upload Documents**: Use the document upload area to process transaction receipts and documents
2. **Review Extracted Data**: View the structured transaction data with sender, receiver, amounts, and details
3. **Export Data**: Download transaction data as Excel or text files for record keeping
4. **Manage Users**: View and manage resident profiles and their associated documents

### For Residents

1. **Upload Transaction Receipts**: Upload mobile payment receipts, bank transfers, or other transaction documents
2. **Automatic Processing**: The system extracts structured data including sender, receiver, amounts, and transaction details
3. **Clean Interface**: All transactions are displayed in a unified, easy-to-read mobile payment format

## OCR API Configuration

The application uses Google Gemini API for intelligent text extraction:

### Gemini API
- **API Key**: `AIzaSyBI0M-FLQUpNRw_rgHPb5gS0ZuJ7NXV4bc`
- **Features**: Advanced AI-powered text extraction, structured data parsing, high accuracy
- **Model**: Gemini 2.0 Flash (optimized for speed and cost)
- **Capabilities**: Extracts transaction details, sender/receiver information, amounts, and dates


## File Requirements

- **Supported Formats**: JPG, JPEG, PNG, PDF
- **File Size**: Maximum 20MB
- **Quality**: Higher resolution images provide better OCR results

## API Limits

- **Gemini API**: Pay-per-use pricing model
- **Rate Limiting**: Based on Google Cloud quotas
- **File Size**: 20MB maximum per file
- **Concurrent Requests**: Based on your Google Cloud project limits

## Customization

### Adding New Customer Fields

Edit the customer data structure in `src/App.jsx`:

```javascript
const [customers, setCustomers] = useState([
  { 
    id: 1, 
    name: 'John Doe', 
    apartment: 'A-101', 
    phone: '+1234567890', 
    email: 'john@example.com',
    // Add new fields here
  }
])
```

### Modifying AI Settings

Update the Gemini configuration in `src/services/GeminiService.js`:

```javascript
const API_KEY = 'your-gemini-api-key' // Update API key
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Static Hosting

The built files in the `dist` directory can be deployed to any static hosting service like:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

## Troubleshooting

### Common Issues

1. **OCR Processing Fails**: Check file format and size limits
2. **No Text Extracted**: Ensure document has clear, readable text
3. **Customer Matching Issues**: Verify customer names are spelled correctly in the database

### API Errors

- **Rate Limit Exceeded**: Check your Google Cloud quotas and billing
- **File Too Large**: Compress images or split PDFs (max 20MB)
- **Invalid API Key**: Verify the API key in GeminiService.js
- **403 Forbidden**: Ensure your Gemini API key has proper permissions

## Support

For technical support or feature requests, please contact the development team.

## License

This project is licensed under the MIT License.