import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AdminSellerEarningsPage = () => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [earningsData, setEarningsData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSellerEarnings();
  }, []);

  const fetchSellerEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/stripe/admin/seller-earnings`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setEarningsData(response.data);
      }
    } catch (err) {
      console.error('Error fetching seller earnings:', err);
      setError(err.response?.data?.error || 'Failed to fetch seller earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEarnings = async () => {
    try {
      setProcessing(true);
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/stripe/admin/process-earnings`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert('Earnings processed successfully!');
        fetchSellerEarnings(); // Refresh data
      }
    } catch (err) {
      console.error('Error processing earnings:', err);
      alert(err.response?.data?.error || 'Failed to process earnings');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading seller earnings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
          <button
            onClick={fetchSellerEarnings}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { totals, sellers } = earningsData || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Seller Earnings Overview
        </h1>
        <p className="text-gray-600">
          Monitor and manage seller earnings across the platform
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Total Pending */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⏰</span>
            {totals?.sellers_with_pending > 0 && (
              <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
                Action Needed
              </span>
            )}
          </div>
          <p className="text-sm text-yellow-800 font-medium mb-1">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-900">
            ${totals?.total_pending?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            {totals?.sellers_with_pending || 0} sellers with pending earnings
          </p>
        </div>

        {/* Total Available */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">✅</span>
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
              Ready
            </span>
          </div>
          <p className="text-sm text-green-800 font-medium mb-1">Total Available</p>
          <p className="text-2xl font-bold text-green-900">
            ${totals?.total_available?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-green-700 mt-2">
            Ready for payout requests
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">💰</span>
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              Complete
            </span>
          </div>
          <p className="text-sm text-blue-800 font-medium mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-blue-900">
            ${totals?.total_paid?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Successfully transferred
          </p>
        </div>

        {/* Total Sellers */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-sm text-purple-800 font-medium mb-1">Active Sellers</p>
          <p className="text-2xl font-bold text-purple-900">
            {sellers?.length || 0}
          </p>
          <p className="text-xs text-purple-700 mt-2">
            With earnings history
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleProcessEarnings}
          disabled={processing}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <span>📈</span>
              Process Earnings
            </>
          )}
        </button>

        <button
          onClick={fetchSellerEarnings}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span>🔄</span>
          Refresh
        </button>

        <button
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <span>📥</span>
          Export Report
        </button>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Seller Earnings Breakdown
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oldest Pending
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellers && sellers.length > 0 ? (
                sellers.map((seller) => (
                  <tr key={seller.seller_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {seller.seller_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {seller.seller_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        seller.pending_balance > 0 ? 'text-yellow-600' : 'text-gray-400'
                      }`}>
                        ${seller.pending_balance.toFixed(2)}
                      </span>
                      {seller.pending_count > 0 && (
                        <p className="text-xs text-gray-500">
                          ({seller.pending_count} items)
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        seller.available_balance > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        ${seller.available_balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-medium ${
                        seller.paid_balance > 0 ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        ${seller.paid_balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {seller.pending_count > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <span className="mr-1">⚠️</span>
                          Action Needed
                        </span>
                      ) : seller.available_balance > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="mr-1">✅</span>
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Up to Date
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {seller.oldest_pending_date ? (
                        <span className="text-sm text-gray-600">
                          {new Date(seller.oldest_pending_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No seller earnings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSellerEarningsPage;
