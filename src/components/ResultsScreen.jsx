import MobilePaymentResults from './MobilePaymentResults'

const ResultsScreen = ({ extractedData, uploadedFile, onBackToUpload }) => {
  // All transactions now use the mobile payment layout
  return (
    <MobilePaymentResults 
      extractedData={extractedData}
      uploadedFile={uploadedFile}
      onBackToUpload={onBackToUpload}
    />
  )
}

export default ResultsScreen