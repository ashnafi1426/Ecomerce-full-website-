import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service.minimal';

const ManagerDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching manager dashboard stats with minimal API...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔐 Token exists:', !!token);
      console.log('👤 User role:', user.role);
      
      const data = await managerAPI.getDashboardStats();
      console.log('✅ Dashboard stats received with minimal API:', data);
      setStats(data.stats || data);
    } catch (err) {
      console.error('❌ Error fetching dashboard stats with minimal API:', err);
      setError(err.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Dashboard</h2>
        <p className="text-[#565959] mb-6">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Manager Dashboard</h1>
        <p className="text-[#565959]">Overview of pending tasks and platform metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/manager/product-approvals" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.pendingProducts || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Product Approvals</div>
        </Link>

        <Link to="/manager/seller-approvals" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.pendingSellers || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Seller Approvals</div>
        </Link>

        <Link to="/manager/orders" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.ordersWithIssues || 0}
          </div>
          <div className="text-sm text-[#565959]">Orders with Issues</div>
        </Link>

        <Link to="/manager/returns" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.pendingReturns || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Returns</div>
        </Link>

        <Link to="/manager/disputes" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.activeDisputes || 0}
          </div>
          <div className="text-sm text-[#565959]">Active Disputes</div>
        </Link>

        <Link to="/manager/refunds" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.pendingRefunds || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Refunds</div>
        </Link>

        <Link to="/manager/support-tickets" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.openTickets || 0}
          </div>
          <div className="text-sm text-[#565959]">Open Support Tickets</div>
        </Link>

        <Link to="/manager/escalations" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats?.escalations || 0}
          </div>
          <div className="text-sm text-[#565959]">Escalated Issues</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] p-6 mb-8">
        <h2 className="text-xl font-semibold text-[#0F1111] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/manager/product-approvals"
            className="flex items-center gap-3 p-4 border border-[#D5D9D9] rounded-lg hover:bg-[#F7F8F8] transition-colors"
          >
            <span className="text-2xl">✅</span>
            <span className="font-medium text-[#0F1111]">Review Products</span>
          </Link>
          <Link
            to="/manager/seller-approvals"
            className="flex items-center gap-3 p-4 border border-[#D5D9D9] rounded-lg hover:bg-[#F7F8F8] transition-colors"
          >
            <span className="text-2xl">🏪</span>
            <span className="font-medium text-[#0F1111]">Review Sellers</span>
          </Link>
          <Link
            to="/manager/orders"
            className="flex items-center gap-3 p-4 border border-[#D5D9D9] rounded-lg hover:bg-[#F7F8F8] transition-colors"
          >
            <span className="text-2xl">🛍️</span>
            <span className="font-medium text-[#0F1111]">Monitor Orders</span>
          </Link>
          <Link
            to="/manager/review-moderation"
            className="flex items-center gap-3 p-4 border border-[#D5D9D9] rounded-lg hover:bg-[#F7F8F8] transition-colors"
          >
            <span className="text-2xl">⭐</span>
            <span className="font-medium text-[#0F1111]">Moderate Reviews</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] p-6">
        <h2 className="text-xl font-semibold text-[#0F1111] mb-4">Recent Activity</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border-b border-[#D5D9D9] last:border-0">
                <span className="text-xl">{activity.icon || '📋'}</span>
                <div className="flex-1">
                  <p className="text-[#0F1111]">{activity.description}</p>
                  <p className="text-sm text-[#565959]">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#565959] text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboardPage;
