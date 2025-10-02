import { useState, useEffect } from 'react';
import { initializeFirebase } from '../firebase/services.js';

const FirebaseSetupGuide = ({ onRetry }) => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [error, setError] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('testing');
    setError(null);
    setSteps([]);

    const newSteps = [];
    
    try {
      newSteps.push({ text: 'Testing Firebase connection...', status: 'loading' });
      setSteps([...newSteps]);

      const isConnected = await initializeFirebase();
      
      if (isConnected) {
        newSteps.push({ text: '✅ Firebase connection successful!', status: 'success' });
        setConnectionStatus('success');
      } else {
        newSteps.push({ text: '❌ Firebase connection failed', status: 'error' });
        setConnectionStatus('error');
        setError('Firebase connection failed. Please check your configuration.');
      }
    } catch (err) {
      newSteps.push({ text: `❌ Error: ${err.message}`, status: 'error' });
      setConnectionStatus('error');
      setError(err.message);
    }

    setSteps([...newSteps]);
  };

  const getSetupInstructions = () => {
    return [
      {
        title: "1. Update Firestore Security Rules",
        description: "Your current rules are blocking all access. Update them to allow read/write access.",
        action: "Go to Firebase Console > Firestore Database > Rules tab",
        code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`
      },
      {
        title: "2. Publish the Rules",
        description: "After updating the rules, click 'Publish' to apply them.",
        action: "Click 'Publish' button in Firebase Console"
      },
      {
        title: "3. Verify Firebase Project",
        description: "Make sure your Firebase project 'parkviewdemo' exists and is active.",
        action: "Go to Firebase Console (https://console.firebase.google.com/)"
      },
      {
        title: "4. Enable Firestore Database",
        description: "In your Firebase project, go to Firestore Database and create a database.",
        action: "Create database in test mode for now"
      }
    ];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            {connectionStatus === 'success' ? (
              <svg className="w-full h-full text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-full h-full text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Firebase Setup
          </h1>
          <p className="text-gray-600">
            {connectionStatus === 'success' 
              ? 'Firebase is properly configured and connected!' 
              : 'There seems to be an issue with your Firebase configuration.'
            }
          </p>
        </div>

        {/* Connection Test Results */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Test</h2>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${
                  step.status === 'success' ? 'bg-green-500' :
                  step.status === 'error' ? 'bg-red-500' :
                  'bg-blue-500 animate-pulse'
                }`}></div>
                <span className={`text-sm ${
                  step.status === 'success' ? 'text-green-700' :
                  step.status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Setup Instructions */}
        {connectionStatus === 'error' && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h2>
            <div className="space-y-4">
              {getSetupInstructions().map((instruction, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{instruction.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{instruction.description}</p>
                  <p className="text-xs text-blue-600 font-medium mb-2">{instruction.action}</p>
                  {instruction.code && (
                    <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
                      <pre>{instruction.code}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Details */}
        {error && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Error Details</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={testConnection}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Connection Again
          </button>
          {connectionStatus === 'success' && (
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Continue to App
            </button>
          )}
        </div>

        {/* Firebase Config Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Current Configuration</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Project ID:</strong> parkviewdemo</p>
            <p><strong>Auth Domain:</strong> parkviewdemo.firebaseapp.com</p>
            <p><strong>Storage Bucket:</strong> parkviewdemo.firebasestorage.app</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetupGuide;
