import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './firebase/config.js' // Initialize Firebase
import { initializeFirebase } from './firebase/services.js'

// Test Firebase connection on startup
initializeFirebase().then((success) => {
  if (success) {
    console.log('🚀 App starting with Firebase connected');
  } else {
    console.error('❌ App starting with Firebase connection issues');
  }
}).catch((error) => {
  console.error('❌ Firebase initialization failed:', error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
