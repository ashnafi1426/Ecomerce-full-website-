import { useState } from 'react';
import { managerAPI } from '../services/api.service';

const ManagerLoginTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Check authentication state
      addResult('Auth State', 'info', 'Checking authentication state...');
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        addResult('Auth State', 'error', 'No token found - user not logged in');
        return;
      }
      
      addResult('Auth State', 'success', `Token exists, User role: ${user.role}`);

      // Test 2: Test manager API endpoint
      addResult('Manager API', 'info', 'Testing manager dashboard API...');
      
      try {
        const dashboardData = await managerAPI.getDashboardStats();
        addResult('Manager API', 'success', `Dashboard API working: ${JSON.stringify(dashboardData)}`);
      } catch (apiError) {
        addResult('Manager API', 'error', `API Error: ${apiError.message} (Status: ${apiError.status})`);
      }

      // Test 3: Test other manager endpoints
      addResult('Manager Endpoints', 'info', 'Testing other manager endpoints...');
      
      try {
        const pendingProducts = await managerAPI.getPendingProducts();
        addResult('Manager Endpoints', 'success', `Pending products: ${pendingProducts?.length || 0} items`);
      } catch (endpointError) {
        addResult('Manager Endpoints', 'error', `Endpoint Error: ${endpointError.message}`);
      }

    } catch (error) {
      addResult('General', 'error', `Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manager Login Debug Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run Manager Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded border-l-4 ${
              result.status === 'success' 
                ? 'bg-green-50 border-green-500 text-green-800'
                : result.status === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : 'bg-blue-50 border-blue-500 text-blue-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{result.test}</h3>
                <p className="mt-1">{result.message}</p>
              </div>
              <span className="text-sm opacity-75">{result.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Test Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>First login with manager credentials: manager@fastshop.com / Manager123!@#</li>
          <li>Then run these tests to see what's failing</li>
          <li>Check browser console for additional debugging info</li>
          <li>Check network tab for failed API calls</li>
        </ol>
      </div>
    </div>
  );
};

export default ManagerLoginTest;