import { useState, useEffect } from 'react'
import DocumentUpload from './components/DocumentUpload'
import ResultsScreen from './components/ResultsScreen'
import MobilePaymentResults from './components/MobilePaymentResults'
import UserListScreen from './components/UserListScreen'
import UserDocumentsScreen from './components/UserDocumentsScreen'
import DocumentViewer from './components/DocumentViewer'
import DocumentsScreen from './components/DocumentsScreen'
import DashboardScreen from './components/DashboardScreen'
import FirebaseSetupGuide from './components/FirebaseSetupGuide'
import Navigation from './components/Navigation'
import OCRService from './services/OCRService'
import { parseMobilePaymentReceipt } from './utils/mobilePaymentParser'
import { createUser } from './firebase/userService'
import { saveDocument } from './firebase/documentService'
import { getAllUsers } from './firebase/userService'
import { getAllDocuments } from './firebase/documentService'

function App() {
  const [currentScreen, setCurrentScreen] = useState('upload') // 'upload', 'results', 'users', 'user-documents', 'document-viewer', 'firebase-setup', 'dashboard'
  const [extractedData, setExtractedData] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [firebaseError, setFirebaseError] = useState(null)
  const [userCount, setUserCount] = useState(0)
  const [documentCount, setDocumentCount] = useState(0)
  const [selectedUserName, setSelectedUserName] = useState(null)
  const [selectedDocumentName, setSelectedDocumentName] = useState(null)
  const [selectedDocumentType, setSelectedDocumentType] = useState(null)
  const [userDocumentCount, setUserDocumentCount] = useState(0)

  // Load stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, documents] = await Promise.all([
        getAllUsers(),
        getAllDocuments()
      ]);
      setUserCount(users.length);
      setDocumentCount(documents.length);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleDocumentUpload = async (file) => {
    setIsProcessing(true)
    setUploadedFile(file)
    
    try {
      const ocrResult = await OCRService.extractText(file)
      
      // Try to parse as mobile payment receipt first
      try {
        const paymentData = parseMobilePaymentReceipt(ocrResult.text)
        // Check if it's a mobile payment receipt by looking for service and amount
        if (paymentData.service !== 'Unknown' && (paymentData.amount > 0 || paymentData.transactionId)) {
          const extractedData = { 
            type: 'mobile_payment', 
            data: paymentData,
            rawOcrText: ocrResult.text 
          }
          
          // Save to Firebase
          await saveDocumentToFirebase(file, extractedData, paymentData.fromName)
          
          setExtractedData(extractedData)
          setCurrentScreen('results')
          return
        }
      } catch (error) {
        // Not a mobile payment receipt, trying bank statement parser
      }
      
      // Fallback to bank statement parser
      const extractedData = ocrResult
      
      // Save to Firebase (for bank statements, we'll use a generic user name)
      await saveDocumentToFirebase(file, extractedData, 'Bank Statement User')
      
      setExtractedData(extractedData)
      setCurrentScreen('results')
    } catch (error) {
      console.error('OCR processing failed:', error)
      alert('Failed to process document. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveDocumentToFirebase = async (file, extractedData, userName) => {
    try {
      // Create or get user
      const userId = await createUser(userName || 'Unknown User')
      
      // Prepare document data
      const documentData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        extractedData: extractedData,
        rawOcrText: extractedData.rawOcrText || extractedData.text,
        documentType: extractedData.type || 'bank_statement'
      }
      
      // Save document
      await saveDocument(userId, documentData)
    } catch (error) {
      console.error('Error saving document to Firebase:', error)
      setFirebaseError(error.message)
      setCurrentScreen('firebase-setup')
      // Don't throw error here to avoid breaking the upload flow
    }
  }

  const handleBackToUpload = () => {
    setCurrentScreen('upload')
    setExtractedData(null)
    setUploadedFile(null)
    setSelectedUserId(null)
    setSelectedDocumentId(null)
    setSelectedUserName(null)
    setSelectedDocumentName(null)
    setSelectedDocumentType(null)
  }

  const handleNavigate = (screen) => {
    setCurrentScreen(screen)
    if (screen === 'users') {
      loadStats() // Refresh stats when navigating to users
    }
  }

  const handleUserSelect = async (userId, userName) => {
    setSelectedUserId(userId)
    setSelectedUserName(userName)
    setCurrentScreen('user-documents')
    
    // Load user's document count
    try {
      const { getUserDocuments } = await import('./firebase/documentService')
      const userDocs = await getUserDocuments(userId)
      setUserDocumentCount(userDocs.length)
    } catch (error) {
      console.error('Error loading user document count:', error)
      setUserDocumentCount(0)
    }
  }

  const handleBackToUsers = () => {
    setCurrentScreen('users')
    setSelectedUserId(null)
  }

  const handleViewDocument = (documentId, documentName, documentType) => {
    setSelectedDocumentId(documentId)
    setSelectedDocumentName(documentName)
    setSelectedDocumentType(documentType)
    setCurrentScreen('document-viewer')
  }

  const handleBackFromDocument = () => {
    setCurrentScreen('user-documents')
    setSelectedDocumentId(null)
  }

  const handleFirebaseSetupRetry = () => {
    setCurrentScreen('upload')
    setFirebaseError(null)
  }

  // Handle different screen states
  if (currentScreen === 'firebase-setup') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <FirebaseSetupGuide 
          onRetry={handleFirebaseSetupRetry}
        />
      </div>
    )
  }

  if (currentScreen === 'document-viewer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <DocumentViewer 
          documentId={selectedDocumentId}
          onBack={handleBackFromDocument}
        />
      </div>
    )
  }

  if (currentScreen === 'users') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <UserListScreen 
          onUserSelect={handleUserSelect}
          onBackToUpload={handleBackToUpload}
        />
      </div>
    )
  }

  if (currentScreen === 'documents') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <DocumentsScreen 
          onBackToUpload={handleBackToUpload}
        />
      </div>
    )
  }

  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <DashboardScreen />
      </div>
    )
  }

  if (currentScreen === 'user-documents') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <UserDocumentsScreen 
          userId={selectedUserId}
          onBackToUsers={handleBackToUsers}
          onViewDocument={handleViewDocument}
        />
      </div>
    )
  }

  if (currentScreen === 'results') {
    // Check if it's a mobile payment receipt
    if (extractedData?.type === 'mobile_payment') {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navigation 
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            userCount={userCount}
            documentCount={documentCount}
            selectedUserId={selectedUserId}
            selectedUserName={selectedUserName}
            selectedDocumentId={selectedDocumentId}
            selectedDocumentName={selectedDocumentName}
            selectedDocumentType={selectedDocumentType}
            onBackToUpload={handleBackToUpload}
            onBackToUsers={handleBackToUsers}
            onBackFromDocument={handleBackFromDocument}
          />
          <div className="container mx-auto px-4 py-8">
            <MobilePaymentResults 
              paymentData={extractedData.data} 
              rawOcrText={extractedData.rawOcrText}
            />
          </div>
        </div>
      )
    }
    
    // Default bank statement results
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation 
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          userCount={userCount}
          documentCount={documentCount}
          userDocumentCount={userDocumentCount}
          selectedUserId={selectedUserId}
          selectedUserName={selectedUserName}
          selectedDocumentId={selectedDocumentId}
          selectedDocumentName={selectedDocumentName}
          selectedDocumentType={selectedDocumentType}
          onBackToUpload={handleBackToUpload}
          onBackToUsers={handleBackToUsers}
          onBackFromDocument={handleBackFromDocument}
        />
        <ResultsScreen 
          extractedData={extractedData}
          uploadedFile={uploadedFile}
          onBackToUpload={handleBackToUpload}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation 
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        userCount={userCount}
        documentCount={documentCount}
        selectedUserId={selectedUserId}
        selectedUserName={selectedUserName}
        selectedDocumentId={selectedDocumentId}
        selectedDocumentName={selectedDocumentName}
        selectedDocumentType={selectedDocumentType}
        onBackToUpload={handleBackToUpload}
        onBackToUsers={handleBackToUsers}
        onBackFromDocument={handleBackFromDocument}
      />

      {/* Main Content */}
      <div className="flex-1 ">
        {currentScreen === 'upload' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <DocumentUpload 
                onUpload={handleDocumentUpload}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}

export default App