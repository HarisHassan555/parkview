import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './services.js';

// User management functions
export const createUser = async (userName) => {
  try {
    console.log('Creating user:', userName);
    
    // Create a safe document ID from userName
    const safeUserId = userName
      .replace(/[^a-zA-Z0-9]/g, '_')  // Replace special chars with underscore
      .replace(/_+/g, '_')           // Replace multiple underscores with single
      .replace(/^_|_$/g, '')         // Remove leading/trailing underscores
      .toLowerCase()                 // Convert to lowercase
    
    // If the safe ID is empty, use a fallback
    const finalUserId = safeUserId || 'anonymous_user';
    
    const userRef = doc(db, 'users', finalUserId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: userName,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        documentCount: 0
      });
      console.log('✅ New user created:', userName, 'with ID:', finalUserId);
    } else {
      // Update last active time for existing user
      await setDoc(userRef, {
        lastActive: serverTimestamp()
      }, { merge: true });
      console.log('✅ Existing user updated:', userName, 'with ID:', finalUserId);
    }
    
    return finalUserId; // Return the safe ID, not the original name
  } catch (error) {
    console.error('❌ Error creating user:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userName: userName
    });
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    
    // First try the optimized query with index
    try {
      const q = query(usersRef, orderBy('lastActive', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (indexError) {
      console.warn('Index not ready, falling back to simple query:', indexError.message);
      
      // Fallback: Get all users and sort client-side
      const allUsersQuery = query(usersRef);
      const querySnapshot = await getDocs(allUsersQuery);
      
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by lastActive descending
      users.sort((a, b) => {
        const aTime = a.lastActive?.toDate ? a.lastActive.toDate() : new Date(a.lastActive);
        const bTime = b.lastActive?.toDate ? b.lastActive.toDate() : new Date(b.lastActive);
        return bTime - aTime;
      });
      
      return users;
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Clear all data from database
export const clearAllData = async () => {
  try {
    console.log('🗑️ Starting to clear all database data...');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    // Get all documents
    const documentsRef = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsRef);
    
    console.log(`Found ${usersSnapshot.size} users and ${documentsSnapshot.size} documents to delete`);
    
    // Use batch operations for better performance
    const batch = writeBatch(db);
    
    // Delete all users
    usersSnapshot.forEach((userDoc) => {
      batch.delete(userDoc.ref);
    });
    
    // Delete all documents
    documentsSnapshot.forEach((docRef) => {
      batch.delete(docRef.ref);
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log('✅ All database data cleared successfully!');
    return {
      usersDeleted: usersSnapshot.size,
      documentsDeleted: documentsSnapshot.size,
      success: true
    };
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};
