import { useState, useEffect } from 'react';
import { getAllUsers } from '../firebase/userService';

const UserListScreen = ({ onUserSelect, onBackToUpload }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Users List */}
        <div className="max-w-6xl mx-auto">
          {users.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">
                No users have uploaded documents yet. Upload a document to create the first user profile.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                  <div className="col-span-6 sm:col-span-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">User</h3>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Documents</h3>
                  </div>
                  <div className="col-span-3 sm:col-span-3 hidden sm:block">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Last Activity</h3>
                  </div>
                  <div className="col-span-0 sm:col-span-3 hidden sm:block">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Joined</h3>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {users.map((user, index) => (
                  <div
                    key={user.id}
                     onClick={() => onUserSelect(user.id, user.name)}
                    className="px-4 sm:px-6 py-5 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                  >
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
                          <p className="text-sm text-gray-500">User ID: {user.id}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{user.documentCount || 0}</div>
                          <div className="text-xs text-gray-600">docs</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Last Active</div>
                          <div className="text-gray-900">{formatDate(user.lastActive)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Joined</div>
                          <div className="text-gray-900">{formatDate(user.createdAt)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                        {/* User Info */}
                        <div className="col-span-6 sm:col-span-4 flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{user.name}</h3>
                            <p className="text-sm text-gray-500">User ID: {user.id}</p>
                          </div>
                        </div>

                        {/* Document Count */}
                        <div className="col-span-3 sm:col-span-2">
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-blue-600">{user.documentCount || 0}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              document{(user.documentCount || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Last Active */}
                        <div className="col-span-3 hidden sm:block">
                          <div className="text-sm text-gray-900">{formatDate(user.lastActive)}</div>
                          <div className="text-xs text-gray-500">Last activity</div>
                        </div>

                        {/* Joined Date */}
                        <div className="col-span-3 hidden sm:block">
                          <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                          <div className="text-xs text-gray-500">Member since</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                      <span>View documents</span>
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListScreen;
