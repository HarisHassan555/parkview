import { useState, useEffect } from 'react';
import { getAllUsers } from '../firebase/userService';
import { getAllDocuments } from '../firebase/documentService';

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    users: [],
    documents: [],
    analytics: {
      totalUsers: 0,
      totalDocuments: 0,
      verifiedDocuments: 0,
      unverifiedDocuments: 0,
      mobilePayments: 0,
      bankStatements: 0,
      monthlyUploads: [],
      userActivity: [],
      documentTypes: [],
      verificationStatus: []
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users and documents
      const [users, documents] = await Promise.all([
        getAllUsers(),
        getAllDocuments()
      ]);

      // Calculate analytics
      const analytics = calculateAnalytics(users, documents);
      
      setDashboardData({
        users,
        documents,
        analytics
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (users, documents) => {
    const totalUsers = users.length;
    const totalDocuments = documents.length;
    
    // Document type analysis
    const mobilePayments = documents.filter(doc => doc.documentType === 'mobile_payment').length;
    const bankStatements = documents.filter(doc => doc.documentType === 'bank_statement').length;
    
    // Verification status analysis
    const verifiedDocuments = documents.filter(doc => doc.verificationStatus === 'verified').length;
    const unverifiedDocuments = documents.filter(doc => !doc.verificationStatus || doc.verificationStatus === null).length;
    const notFoundDocuments = documents.filter(doc => doc.verificationStatus === 'not found').length;
    
    // Monthly uploads analysis
    const monthlyUploads = getMonthlyUploads(documents);
    
    // User activity analysis
    const userActivity = getUserActivity(users, documents);
    
    // Document types for pie chart (lighter shades for better visibility)
    const documentTypes = [
      { name: 'Mobile Payments', value: mobilePayments, color: '#93C5FD' }, // lighter blue
      { name: 'Bank Statements', value: bankStatements, color: '#6EE7B7' } // lighter green
    ];
    
    // Verification status for pie chart (slightly darker for better visibility)
    const verificationStatus = [
      { name: 'Verified', value: verifiedDocuments, color: '#BBF7D0' }, // darker green
      { name: 'Unverified', value: unverifiedDocuments, color: '#E5E7EB' }, // darker gray
      { name: 'Not Found', value: notFoundDocuments, color: '#FECACA' } // darker red
    ];

    return {
      totalUsers,
      totalDocuments,
      verifiedDocuments,
      unverifiedDocuments,
      mobilePayments,
      bankStatements,
      monthlyUploads,
      userActivity,
      documentTypes,
      verificationStatus
    };
  };

  const getMonthlyUploads = (documents) => {
    const monthlyData = {};
    
    documents.forEach(doc => {
      const date = new Date(doc.uploadedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month]++;
    });
    
    return Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getUserActivity = (users, documents) => {
    return users.map(user => {
      const userDocs = documents.filter(doc => doc.userId === user.id);
      return {
        name: user.name,
        documents: userDocs.length,
        verified: userDocs.filter(doc => doc.verificationStatus === 'verified').length
      };
    }).sort((a, b) => b.documents - a.documents);
  };

  const handleFilterClick = (filterType, filterValue) => {
    const { documents } = dashboardData;
    let filtered = [];

    if (filterType === 'verification') {
      if (filterValue === 'verified') {
        filtered = documents.filter(doc => doc.verificationStatus === 'verified');
      } else if (filterValue === 'unverified') {
        filtered = documents.filter(doc => !doc.verificationStatus || doc.verificationStatus === null);
      } else if (filterValue === 'not_found') {
        filtered = documents.filter(doc => doc.verificationStatus === 'not found');
      }
    } else if (filterType === 'document_type') {
      if (filterValue === 'mobile_payment') {
        filtered = documents.filter(doc => doc.documentType === 'mobile_payment');
      } else if (filterValue === 'bank_statement') {
        filtered = documents.filter(doc => doc.documentType === 'bank_statement');
      }
    }

    setFilteredDocuments(filtered);
    setSelectedFilter({ type: filterType, value: filterValue });
  };

  const closeFilter = () => {
    setSelectedFilter(null);
    setFilteredDocuments([]);
  };

  // Simple Pie Chart Component
  const PieChart = ({ data, title, size = 200, filterType }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    const getFilterValue = (itemName) => {
      if (filterType === 'verification') {
        if (itemName === 'Verified') return 'verified';
        if (itemName === 'Unverified') return 'unverified';
        if (itemName === 'Not Found') return 'not_found';
      } else if (filterType === 'document_type') {
        if (itemName === 'Mobile Payments') return 'mobile_payment';
        if (itemName === 'Bank Statements') return 'bank_statement';
      }
      return null;
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const circumference = 2 * Math.PI * (size / 2 - 10);
                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
                
                cumulativePercentage += percentage;
                
                return (
                  <circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={size / 2 - 10}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer hover:opacity-80"
                    onClick={() => {
                      const filterValue = getFilterValue(item.name);
                      if (filterValue) {
                        handleFilterClick(filterType, filterValue);
                      }
                    }}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => {
            const filterValue = getFilterValue(item.name);
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  filterValue ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
                onClick={() => {
                  if (filterValue) {
                    handleFilterClick(filterType, filterValue);
                  }
                }}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Simple Bar Chart Component
  const BarChart = ({ data, title, xLabel, yLabel }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 truncate mr-3">
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-blue-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{item.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          {xLabel} • {yLabel}
        </div>
      </div>
    );
  };

  // Simple Line Chart Component
  const LineChart = ({ data, title, xLabel, yLabel }) => {
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue || 1;
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 200;
      const y = 100 - ((item.value - minValue) / range) * 80;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-48 flex items-center justify-center">
          <svg width="250" height="120" className="overflow-visible">
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              points={points}
              className="drop-shadow-sm"
            />
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 200;
              const y = 100 - ((item.value - minValue) / range) * 80;
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3B82F6"
                    className="drop-shadow-sm"
                  />
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          {xLabel} • {yLabel}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { analytics } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into users and transactions</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.verifiedDocuments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.unverifiedDocuments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Document Types Pie Chart */}
          <PieChart 
            data={analytics.documentTypes} 
            title="Document Types Distribution"
            size={180}
            filterType="document_type"
          />

          {/* Verification Status Pie Chart */}
          <PieChart 
            data={analytics.verificationStatus} 
            title="Verification Status"
            size={180}
            filterType="verification"
          />
        </div>

        {/* Top Active Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Active Users</h3>
          <div className="space-y-3">
            {analytics.userActivity.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user.documents} docs</div>
                  <div className="text-xs text-gray-500">{user.verified} verified</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Popup Modal */}
        {selectedFilter && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50" style={{pointerEvents: 'all'}}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedFilter.type === 'verification' 
                    ? `All ${selectedFilter.value === 'verified' ? 'Verified' : selectedFilter.value === 'unverified' ? 'Unverified' : 'Not Found'} Documents`
                    : `All ${selectedFilter.value === 'mobile_payment' ? 'Mobile Payment' : 'Bank Statement'} Documents`
                  }
                </h3>
                <button
                  onClick={closeFilter}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
                    <p className="text-gray-600">No documents match the selected filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDocuments.map((document) => (
                      <div key={document.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                {document.documentType === 'mobile_payment' ? (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{document.fileName}</h4>
                                <p className="text-sm text-gray-600">
                                  {document.documentType === 'mobile_payment' ? 'Mobile Payment Receipt' : 'Bank Statement'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">User:</span>
                                <span className="ml-2 text-gray-900">
                                  {dashboardData.users.find(u => u.id === document.userId)?.name || 'Unknown'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Uploaded:</span>
                                <span className="ml-2 text-gray-900">
                                  {document.uploadedAt ? new Date(document.uploadedAt.seconds ? document.uploadedAt.seconds * 1000 : document.uploadedAt).toLocaleDateString() : 'Unknown'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <span className="ml-2">
                                  {document.verificationStatus === 'verified' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Verified
                                    </span>
                                  ) : document.verificationStatus === 'not found' ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Not Found
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      Unverified
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </div>
                <button
                  onClick={closeFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardScreen;
