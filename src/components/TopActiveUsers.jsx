import { useState, useEffect } from 'react';
import { getAllUsers } from '../firebase/userService';
import { getAllDocuments } from '../firebase/documentService';

const TopActiveUsers = () => {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [usersData, documentsData] = await Promise.all([
        getAllUsers(),
        getAllDocuments()
      ]);
      
      setUsers(usersData);
      setDocuments(documentsData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserActivity = () => {
    return users.map(user => {
      const userDocs = documents.filter(doc => doc.userId === user.id);
      return {
        id: user.id,
        name: user.name,
        documents: userDocs.length,
        verified: userDocs.filter(doc => doc.verificationStatus === 'verified').length
      };
    }).sort((a, b) => b.documents - a.documents).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Loading users...</span>
      </div>
    );
  }

  const userActivity = getUserActivity();

  if (userActivity.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-sm text-gray-500">No users found. Upload a document to get started.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {userActivity.map((user, index) => (
        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-blue-600">{index + 1}</span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500">{user.documents} docs</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{user.verified} verified</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopActiveUsers;
