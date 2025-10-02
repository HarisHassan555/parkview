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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './services.js';

// User management functions
export const createUser = async (userName) => {
  try {
    console.log('Creating user:', userName);
    const userRef = doc(db, 'users', userName);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        name: userName,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        documentCount: 0
      });
      console.log('✅ New user created:', userName);
    } else {
      // Update last active time for existing user
      await setDoc(userRef, {
        lastActive: serverTimestamp()
      }, { merge: true });
      console.log('✅ Existing user updated:', userName);
    }
    
    return userName;
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
