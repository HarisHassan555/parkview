import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/services.js';

/**
 * Clean up dummy data to have manageable dataset
 * - Max 10 users per month
 * - 1-2 documents per user per month
 */
export const cleanupDummyData = async () => {
  try {
    console.log('🧹 Starting data cleanup...');
    
    // Get all documents
    const documentsRef = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsRef);
    const allDocuments = [];
    
    documentsSnapshot.forEach((doc) => {
      allDocuments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`📊 Found ${allDocuments.length} total documents`);
    
    // Group documents by month and user
    const documentsByMonthAndUser = {};
    
    allDocuments.forEach(doc => {
      try {
        const date = doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt);
        const monthYear = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        if (!documentsByMonthAndUser[monthYear]) {
          documentsByMonthAndUser[monthYear] = {};
        }
        
        if (!documentsByMonthAndUser[monthYear][doc.userId]) {
          documentsByMonthAndUser[monthYear][doc.userId] = [];
        }
        
        documentsByMonthAndUser[monthYear][doc.userId].push(doc);
      } catch (error) {
        console.error('Error processing document date:', error);
      }
    });
    
    // Clean up each month
    let totalDeleted = 0;
    const monthsToProcess = Object.keys(documentsByMonthAndUser);
    
    for (const month of monthsToProcess) {
      console.log(`📅 Processing month: ${month}`);
      const monthData = documentsByMonthAndUser[month];
      const userIds = Object.keys(monthData);
      
      // Sort users by document count (descending) to keep users with most documents
      const sortedUsers = userIds.sort((a, b) => {
        return monthData[b].length - monthData[a].length;
      });
      
      // Keep only first 10 users for this month
      const usersToKeep = sortedUsers.slice(0, 10);
      const usersToDelete = sortedUsers.slice(10);
      
      console.log(`👥 Month ${month}: Keeping ${usersToKeep.length} users, deleting ${usersToDelete.length} users`);
      
      // Delete all documents from users not in the top 10
      for (const userId of usersToDelete) {
        const userDocuments = monthData[userId];
        for (const document of userDocuments) {
          try {
            await deleteDoc(doc(db, 'documents', document.id));
            totalDeleted++;
            console.log(`🗑️ Deleted document: ${document.fileName}`);
          } catch (error) {
            console.error('Error deleting document:', error);
          }
        }
      }
      
      // For remaining users, keep only 1-2 documents per user
      for (const userId of usersToKeep) {
        const userDocuments = monthData[userId];
        
        // Sort documents by upload date (newest first)
        userDocuments.sort((a, b) => {
          const dateA = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
          const dateB = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
          return dateB - dateA;
        });
        
        // Keep only first 2 documents, delete the rest
        const documentsToKeep = userDocuments.slice(0, 2);
        const documentsToDelete = userDocuments.slice(2);
        
        console.log(`👤 User ${userId} in ${month}: Keeping ${documentsToKeep.length} documents, deleting ${documentsToDelete.length} documents`);
        
        for (const document of documentsToDelete) {
          try {
            await deleteDoc(doc(db, 'documents', document.id));
            totalDeleted++;
            console.log(`🗑️ Deleted document: ${document.fileName}`);
          } catch (error) {
            console.error('Error deleting document:', error);
          }
        }
      }
    }
    
    // Update user document counts after cleanup
    console.log('🔄 Updating user document counts...');
    await updateUserDocumentCounts();
    
    console.log(`✅ Data cleanup completed! Deleted ${totalDeleted} documents`);
    return {
      success: true,
      deletedCount: totalDeleted,
      message: `Successfully cleaned up data. Deleted ${totalDeleted} documents.`
    };
    
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    return {
      success: false,
      error: error.message,
      message: `Error during cleanup: ${error.message}`
    };
  }
};

/**
 * Update user document counts to match actual documents
 */
export const updateUserDocumentCounts = async () => {
  try {
    console.log('🔄 Starting user document count update...');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    let updatedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Count actual documents for this user
      const documentsRef = collection(db, 'documents');
      const userDocsQuery = query(documentsRef, where('userId', '==', userId));
      const userDocsSnapshot = await getDocs(userDocsQuery);
      
      const actualCount = userDocsSnapshot.size;
      const storedCount = userData.documentCount || 0;
      
      // Update if counts don't match
      if (actualCount !== storedCount) {
        try {
          await updateDoc(doc(db, 'users', userId), {
            documentCount: actualCount
          });
          console.log(`✅ Updated ${userId}: ${storedCount} → ${actualCount} documents`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Error updating user ${userId}:`, error);
        }
      }
    }
    
    console.log(`✅ User document count update completed! Updated ${updatedCount} users`);
    return {
      success: true,
      updatedCount,
      message: `Updated document counts for ${updatedCount} users`
    };
    
  } catch (error) {
    console.error('❌ Error updating user document counts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get current data statistics
 */
export const getDataStatistics = async () => {
  try {
    // Get all documents
    const documentsRef = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsRef);
    const allDocuments = [];
    
    documentsSnapshot.forEach((doc) => {
      allDocuments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Group by month and user
    const stats = {
      totalDocuments: allDocuments.length,
      months: {},
      totalUsers: new Set()
    };
    
    allDocuments.forEach(doc => {
      try {
        const date = doc.uploadedAt?.toDate ? doc.uploadedAt.toDate() : new Date(doc.uploadedAt);
        const monthYear = date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        if (!stats.months[monthYear]) {
          stats.months[monthYear] = {
            totalDocuments: 0,
            users: new Set()
          };
        }
        
        stats.months[monthYear].totalDocuments++;
        stats.months[monthYear].users.add(doc.userId);
        stats.totalUsers.add(doc.userId);
      } catch (error) {
        console.error('Error processing document:', error);
      }
    });
    
    // Convert sets to counts
    Object.keys(stats.months).forEach(month => {
      stats.months[month].userCount = stats.months[month].users.size;
      delete stats.months[month].users;
    });
    
    stats.totalUsers = stats.totalUsers.size;
    
    return stats;
    
  } catch (error) {
    console.error('Error getting statistics:', error);
    return null;
  }
};

export default {
  cleanupDummyData,
  getDataStatistics
};
