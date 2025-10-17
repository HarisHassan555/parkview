import { useState } from 'react';

const Navigation = ({ 
  currentScreen, 
  onNavigate, 
  userCount, 
  documentCount, 
  userDocumentCount,
  selectedUserId, 
  selectedUserName, 
  selectedDocumentId, 
  selectedDocumentName,
  selectedDocumentType,
  onBackToUpload,
  onBackToUsers,
  onBackFromDocument
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: 'upload',
      label: 'Upload',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      description: 'Upload documents'
    },
    {
      id: 'users',
      label: 'Users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      description: 'Manage users'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'View all documents'
    },
    {
      id: 'excel-sync',
      label: 'Excel Sync',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Sync with Excel data'
    },
    {
      id: 'comparison',
      label: 'Comparison',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Compare reports'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Analytics and insights'
    }
  ];

  const isActive = (itemId) => currentScreen === itemId;

  // Get current navigation state
  const getNavigationState = () => {
    if (currentScreen === 'user-documents' && selectedUserName) {
      return {
        type: 'user-documents',
        title: selectedUserName,
        subtitle: `${userDocumentCount || 0} document${(userDocumentCount || 0) !== 1 ? 's' : ''}`,
        leftButton: {
          label: 'Back to Users',
          onClick: onBackToUsers,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )
        }
      };
    }
    
    if (currentScreen === 'document-viewer' && selectedDocumentName) {
      return {
        type: 'document-viewer',
        title: selectedDocumentName,
        subtitle: selectedDocumentType === 'mobile_payment' ? 'Mobile Payment Receipt' : 'Bank Statement',
        leftButton: {
          label: 'Back',
          onClick: onBackFromDocument,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )
        }
      };
    }
    
    if (currentScreen === 'results') {
      return {
        type: 'results',
        title: 'Document Results',
        subtitle: 'AI Processing Complete',
        leftButton: {
          label: 'Back to Upload',
          onClick: onBackToUpload,
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )
        },
        rightButton: {
          label: 'Go to Users',
          onClick: () => onNavigate('users'),
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        }
      };
    }
    
    return {
      type: 'default',
      title: 'AI IBFT Reader',
      subtitle: 'Inter Bank Funds Transfer Processing',
      showNavigation: true
    };
  };

  const navState = getNavigationState();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 relative">
          {/* Left Side - Back Button or Logo */}
          <div className="absolute left-0 flex items-center">
            {navState.leftButton ? (
              <button
                onClick={navState.leftButton.onClick}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <span className="mr-2">{navState.leftButton.icon}</span>
                <span className="hidden sm:inline">{navState.leftButton.label}</span>
              </button>
            ) : (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{navState.title}</h1>
                  <p className="text-xs text-gray-500">{navState.subtitle}</p>
                </div>
              </div>
            )}
          </div>

          {/* Center - Navigation Tabs (Hidden on Mobile) */}
          {navState.showNavigation && (
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.id)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.description}
                >
                  <span className="mr-2">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Center - Title for context screens */}
          {navState.type !== 'default' && !navState.showNavigation && (
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs">
                {navState.title}
              </h1>
            </div>
          )}

          {/* Right Side - Context Info or Stats */}
          <div className="absolute right-0 flex items-center space-x-4">
            {navState.rightButton ? (
              <button
                onClick={navState.rightButton.onClick}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">{navState.rightButton.icon}</span>
                <span className="hidden sm:inline">{navState.rightButton.label}</span>
              </button>
            ) : navState.type === 'user-documents' ? (
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">{navState.subtitle}</div>
              </div>
            ) : navState.type === 'document-viewer' ? (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{navState.subtitle}</div>
              </div>
            ) : navState.showNavigation ? (
              <>
                {/* System Status */}
                <div className="hidden lg:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">System Online</span>
                </div>

                {/* User Count Only - Show only when Users tab is active */}
                {currentScreen === 'users' && (
                  <div className="hidden lg:flex items-center">
                    <div className="text-sm font-medium text-blue-600">
                      {userCount} Users
                    </div>
                  </div>
                )}

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && navState.showNavigation && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.id)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
              

              {/* Mobile Stats - Show only when Users tab is active */}
              {currentScreen === 'users' && (
                <div className="flex items-center justify-center px-3 py-2 border-t border-gray-200 mt-2">
                  <div className="text-sm font-medium text-blue-600">
                    {userCount} Users
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
