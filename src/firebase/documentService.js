import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from './services.js';

// Document management functions
export const saveDocument = async (userId, documentData) => {
  try {
    console.log('Saving document for user:', userId);
    const documentsRef = collection(db, 'documents');
    const docRef = await addDoc(documentsRef, {
      userId: userId,
      fileName: documentData.fileName,
      fileType: documentData.fileType,
      fileSize: documentData.fileSize,
      extractedData: documentData.extractedData,
      rawOcrText: documentData.rawOcrText,
      documentType: documentData.documentType, // 'mobile_payment' or 'bank_statement'
      uploadedAt: serverTimestamp(),
      processedAt: serverTimestamp()
    });

    // Update user's document count
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      documentCount: increment(1),
      lastActive: serverTimestamp()
    });

    console.log('✅ Document saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving document:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      userId: userId,
      fileName: documentData.fileName
    });
    throw error;
  }
};

export const getUserDocuments = async (userId) => {
  try {
    const documentsRef = collection(db, 'documents');
    
    // First try the optimized query with index
    try {
      const q = query(
        documentsRef, 
        where('userId', '==', userId),
        orderBy('uploadedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (indexError) {
      console.warn('Index not ready, falling back to simple query:', indexError.message);
      
      // Fallback: Get all documents and filter client-side
      const allDocsQuery = query(documentsRef);
      const querySnapshot = await getDocs(allDocsQuery);
      
      const documents = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId) {
          documents.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Sort by uploadedAt descending
      documents.sort((a, b) => {
        const aTime = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const bTime = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        return bTime - aTime;
      });
      
      return documents;
    }
  } catch (error) {
    console.error('Error fetching user documents:', error);
    throw error;
  }
};

export const getDocumentById = async (documentId) => {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

export const getAllDocuments = async () => {
  try {
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return documents;
  } catch (error) {
    console.error('Error fetching all documents:', error);
    throw error;
  }
};
