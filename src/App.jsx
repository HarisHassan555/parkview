import { useState, useEffect } from 'react'
import DocumentUpload from './components/DocumentUpload'
import ResultsScreen from './components/ResultsScreen'
import UserListScreen from './components/UserListScreen'
import UserDocumentsScreen from './components/UserDocumentsScreen'
import DocumentViewer from './components/DocumentViewer'
import DocumentsScreen from './components/DocumentsScreen'
import DashboardScreen from './components/DashboardScreen'
import FirebaseSetupGuide from './components/FirebaseSetupGuide'
import Navigation from './components/Navigation'
import ExcelSyncUpload from './components/ExcelSyncUpload'
import OCRService from './services/OCRService'
import { parseMobilePaymentReceipt } from './utils/mobilePaymentParser'
import { createUser, clearAllData } from './firebase/userService'
import { saveDocument } from './firebase/documentService'
import { getAllUsers } from './firebase/userService'
import { getAllDocuments } from './firebase/documentService'

function App() {
  const [currentScreen, setCurrentScreen] = useState('upload') // 'upload', 'results', 'users', 'user-documents', 'document-viewer', 'firebase-setup', 'dashboard', 'excel-sync'
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
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
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

  const handleClearDatabase = async () => {
    setIsClearing(true);
    try {
      const result = await clearAllData();
      console.log('Database cleared:', result);
      
      // Reset all state
      setExtractedData(null);
      setUploadedFile(null);
      setSelectedUserId(null);
      setSelectedDocumentId(null);
      setSelectedUserName(null);
      setSelectedDocumentName(null);
      setSelectedDocumentType(null);
      
      // Reload stats
      await loadStats();
      
      // Show success message
      alert(`Database cleared successfully!\n\nDeleted:\n- ${result.usersDeleted} users\n- ${result.documentsDeleted} documents`);
      
    } catch (error) {
      console.error('Error clearing database:', error);
      alert('Error clearing database: ' + error.message);
    } finally {
      setIsClearing(false);
      setShowClearConfirm(false);
    }
  };

  const handleDocumentUpload = async (file) => {
    setIsProcessing(true)
    setUploadedFile(file)
    
    try {
      const ocrResult = await OCRService.extractText(file)
      
      // Check if we have structured data from Gemini
      if (ocrResult.structuredData) {
        // Map Gemini structured data to the format expected by MobilePaymentResults
        const mappedData = {
          service: ocrResult.structuredData.to?.bank,
          amount: ocrResult.structuredData.amount?.value,
          currency: ocrResult.structuredData.amount?.currency,
          status: ocrResult.structuredData.status,
          transactionId: ocrResult.structuredData.reference_number,
          date: ocrResult.structuredData.date,
          time: ocrResult.structuredData.time,
          fromName: ocrResult.structuredData.from?.name,
          fromPhone: null, // No phone number in Gemini response
          fromAccount: ocrResult.structuredData.from?.account_number,
          toName: ocrResult.structuredData.to?.name,
          toPhone: null, // No phone number in Gemini response
          toAccount: ocrResult.structuredData.to?.account_number,
          fee: 0,
          totalAmount: ocrResult.structuredData.amount?.value ? parseFloat(ocrResult.structuredData.amount.value) : null,
          description: ocrResult.structuredData.purpose_of_transfer
        }
        
        const extractedData = {
          ...ocrResult,
          type: 'mobile_payment', // Use mobile payment layout for all transactions
          data: mappedData
        }
        
        // Save to Firebase with structured data
        console.log('🔍 Gemini sender name:', ocrResult.structuredData.from?.name)
        await saveDocumentToFirebase(file, extractedData, ocrResult.structuredData.from?.name)
        
        setExtractedData(extractedData)
        setCurrentScreen('results')
        return
      }
      
      // Fallback: Try to parse as mobile payment receipt
      try {
        const paymentData = parseMobilePaymentReceipt(ocrResult.text)
        const extractedData = { 
          type: 'mobile_payment', 
          data: paymentData,
          rawOcrText: ocrResult.text 
        }
        
        // Save to Firebase
        console.log('🔍 Parser sender name:', paymentData.fromName)
        await saveDocumentToFirebase(file, extractedData, paymentData.fromName)
        
        setExtractedData(extractedData)
        setCurrentScreen('results')
        return
      } catch (error) {
        // If parsing fails, create a basic mobile payment structure
        const extractedData = {
          ...ocrResult,
          type: 'mobile_payment',
          data: {
            service: null,
            amount: null,
            fromName: null,
            toName: null,
            transactionId: null,
            date: null,
            time: null,
            status: null
          }
        }
        
        await saveDocumentToFirebase(file, extractedData, null)
        setExtractedData(extractedData)
        setCurrentScreen('results')
      }
    } catch (error) {
      console.error('OCR processing failed:', error)
      alert('Failed to process document. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveDocumentToFirebase = async (file, extractedData, userName) => {
    try {
      // Only create user if we have a valid sender name
      let userId = null
      if (userName && userName.trim() !== '') {
        userId = await createUser(userName)
      } else {
        // If no sender name, create a generic user for the document
        userId = await createUser('Anonymous User')
      }
      
      // Prepare document data
      const documentData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        extractedData: extractedData,
        rawOcrText: extractedData.rawOcrText || extractedData.text,
        documentType: extractedData.type || 'mobile_payment'
      }
      
      // Save document
      await saveDocument(userId, documentData)
      console.log('✅ Document saved successfully for user:', userId)
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
          <ResultsScreen 
            extractedData={extractedData}
            uploadedFile={uploadedFile}
            onBackToUpload={handleBackToUpload}
          />
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
            
            {/* Clear Database Section */}
            <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Database Management</h3>
                  <p className="text-sm text-red-700">
                    Clear all users and documents from the database to start fresh
                  </p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isClearing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isClearing ? 'Clearing...' : 'Clear Database'}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'excel-sync' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ExcelSyncUpload 
              onSyncComplete={(results) => {
                console.log('Sync completed:', results);
                // Optionally refresh stats or show success message
                loadStats();
              }}
            />
          </div>
        )}
        
      </div>

      {/* Clear Database Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Clear Database</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                This will permanently delete all users and documents from the database. 
                This action cannot be undone.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ This will delete:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>All user accounts ({userCount} users)</li>
                  <li>All uploaded documents ({documentCount} documents)</li>
                  <li>All transaction data and history</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearDatabase}
                  disabled={isClearing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isClearing ? 'Clearing...' : 'Yes, Clear Database'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App