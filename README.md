# Parkview Housing Society - Document Upload Portal

A React application built with Vite and Tailwind CSS that allows residents to upload documents and automatically extracts data using OCR technology.

## Features

- **Document Upload**: Drag and drop or click to upload images (JPG, PNG) and PDF documents
- **OCR Processing**: Automatic text extraction using OCR.space API
- **Customer Management**: View and manage resident profiles
- **Data Matching**: Automatically match extracted text with customer names
- **Profile Integration**: Add extracted document data to customer profiles

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS
- **OCR Service**: OCR.space API (Free tier: 25,000 requests/month)
- **File Support**: JPG, PNG, PDF (up to 5MB for free tier)

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

1. **Upload Documents**: Use the document upload area to process resident documents
2. **Review Extracted Data**: View the OCR-extracted text from uploaded documents
3. **Match Customers**: The system automatically suggests customer matches based on names found in the text
4. **Add to Profiles**: Click "Add Document" to associate the extracted data with a customer profile

### For Residents

1. **Upload Bills**: Upload monthly utility bills, maintenance receipts, or other documents
2. **Automatic Processing**: The system extracts text and matches it with your profile
3. **Profile Updates**: Your document data is automatically added to your profile

## OCR API Configuration

The application uses OCR.space API with the following configuration:

- **API Key**: `K89756115288957` (Free tier)
- **Engine**: OCR Engine 2 (better text recognition)
- **Language**: English
- **Features**: 
  - Orientation detection
  - Image scaling for better results
  - Multi-page PDF support

## File Requirements

- **Supported Formats**: JPG, JPEG, PNG, PDF
- **File Size**: Maximum 5MB (free tier limit)
- **Quality**: Higher resolution images provide better OCR results

## API Limits

- **Free Tier**: 25,000 requests per month
- **Rate Limit**: 500 requests per day per IP
- **File Size**: 1MB limit for free tier (upgraded to 5MB in code)

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

### Modifying OCR Settings

Update the OCR configuration in `src/services/OCRService.js`:

```javascript
formData.append('language', 'eng') // Change language
formData.append('OCREngine', '2') // Switch between engines 1 and 2
formData.append('detectOrientation', 'true') // Enable/disable orientation detection
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

- **Rate Limit Exceeded**: Wait 24 hours or upgrade to PRO plan
- **File Too Large**: Compress images or split PDFs
- **Invalid API Key**: Verify the API key in OCRService.js

## Support

For technical support or feature requests, please contact the development team.

## License

This project is licensed under the MIT License.