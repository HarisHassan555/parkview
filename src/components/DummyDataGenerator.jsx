import React, { useState } from 'react';
import { cleanupDummyData, getDataStatistics, updateUserDocumentCounts } from '../utils/dataCleanup.js';

const DataCleanup = () => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [showStats, setShowStats] = useState(false);

  const handleGetStatistics = async () => {
    setStatus('Loading data statistics...');
    try {
      const stats = await getDataStatistics();
      setStatistics(stats);
      setShowStats(true);
      setStatus('✅ Statistics loaded successfully!');
    } catch (error) {
      setStatus(`❌ Error loading statistics: ${error.message}`);
      console.error('Error loading statistics:', error);
    }
  };

  const handleCleanupData = async () => {
    setIsCleaning(true);
    setStatus('Starting data cleanup...');
    setProgress(10);
    
    try {
      setStatus('Analyzing current data...');
      setProgress(30);
      
      setStatus('Cleaning up excess documents...');
      setProgress(60);
      
      const result = await cleanupDummyData();
      
      if (result.success) {
        setStatus(`✅ Data cleanup completed! ${result.message}`);
        setProgress(100);
      } else {
        setStatus(`❌ Error: ${result.message}`);
        setProgress(0);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      console.error('Error during cleanup:', error);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleFixDocumentCounts = async () => {
    setIsFixing(true);
    setStatus('Fixing user document counts...');
    setProgress(50);
    
    try {
      const result = await updateUserDocumentCounts();
      
      if (result.success) {
        setStatus(`✅ Document counts fixed! ${result.message}`);
        setProgress(100);
      } else {
        setStatus(`❌ Error: ${result.error}`);
        setProgress(0);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      console.error('Error fixing document counts:', error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Data Cleanup Tool
        </h2>
        <p className="text-gray-600">
          Clean up dummy data to have a manageable dataset: max 10 users per month with 1-2 documents each.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            View Statistics
          </h3>
          <p className="text-blue-600 text-sm mb-3">
            Check current data statistics to see how many documents and users exist.
          </p>
          <button
            onClick={handleGetStatistics}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            View Statistics
          </button>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Fix Document Counts
          </h3>
          <p className="text-green-600 text-sm mb-3">
            Update user document counts to match actual documents in database.
          </p>
          <button
            onClick={handleFixDocumentCounts}
            disabled={isFixing}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFixing ? 'Fixing...' : 'Fix Counts'}
          </button>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Cleanup Data
          </h3>
          <p className="text-red-600 text-sm mb-3">
            Remove excess documents to keep only 10 users per month with 1-2 documents each.
          </p>
          <button
            onClick={handleCleanupData}
            disabled={isCleaning}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCleaning ? 'Cleaning...' : 'Cleanup Data'}
          </button>
        </div>
      </div>

      {(isCleaning || isFixing || progress > 0) && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {status && (
        <div className={`p-4 rounded-lg ${
          status.includes('✅') 
            ? 'bg-green-50 text-green-800' 
            : status.includes('❌') 
            ? 'bg-red-50 text-red-800' 
            : 'bg-blue-50 text-blue-800'
        }`}>
          <p className="font-medium">{status}</p>
        </div>
      )}

      {showStats && statistics && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-4">Current Data Statistics:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Overall Statistics</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Total Documents: {statistics.totalDocuments}</li>
                <li>• Total Users: {statistics.totalUsers}</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">By Month</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(statistics.months).map(([month, data]) => (
                  <li key={month}>• {month}: {data.totalDocuments} docs, {data.userCount} users</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">What cleanup will do:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Keep maximum 10 users per month</li>
          <li>• Keep only 1-2 documents per user per month</li>
          <li>• Delete excess documents to reduce data size</li>
          <li>• Prioritize users with most documents</li>
          <li>• Keep newest documents for each user</li>
        </ul>
      </div>
    </div>
  );
};

export default DataCleanup;
