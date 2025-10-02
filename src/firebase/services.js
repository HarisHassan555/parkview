// Firebase services configuration
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { app } from "./config.js";

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Test Firebase connection with better error handling
export const testFirebaseConnection = async () => {
  try {
    console.log("Testing Firebase connection...");
    console.log("App:", app);
    console.log("Database:", db);
    console.log("Auth:", auth);
    console.log("Storage:", storage);
    
    // Test Firestore connection by trying to read from a test collection
    const { collection, getDocs, addDoc, deleteDoc } = await import("firebase/firestore");
    const testCollection = collection(db, "test");
    
    try {
      // First, try to read from test collection
      await getDocs(testCollection);
      console.log("✅ Firebase Firestore connection successful!");
      return true;
    } catch (firestoreError) {
      console.error("❌ Firestore connection failed:", firestoreError);
      
      // Check if it's a permission error
      if (firestoreError.code === 'permission-denied') {
        console.error("🔒 Permission denied - Check your Firestore security rules!");
        console.error("Current rules are blocking access. Update rules to allow read/write access.");
        return false;
      }
      
      // Check if it's a configuration error
      if (firestoreError.code === 'not-found' || firestoreError.message.includes('CONFIGURATION_NOT_FOUND')) {
        console.error("🔧 Configuration not found - Check your Firebase project setup!");
        return false;
      }
      
      console.error("❌ Other Firestore error:", firestoreError.code, firestoreError.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    return false;
  }
};

// Initialize Firebase with error handling
export const initializeFirebase = async () => {
  try {
    console.log("Initializing Firebase...");
    const isConnected = await testFirebaseConnection();
    if (isConnected) {
      console.log("✅ Firebase initialized successfully!");
      return true;
    } else {
      console.error("❌ Firebase initialization failed!");
      return false;
    }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    return false;
  }
};
