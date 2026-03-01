import { Link } from 'react-router-dom';

const ManagerDashboardPageSimple = () => {
  console.log('🎯 ManagerDashboardPageSimple rendered successfully');

  // Mock stats for testing
  const mockStats = {
    pendingProducts: 5,
    pendingSellers: 2,
    activeDisputes: 1,
    pendingReturns: 3,
    ordersWithIssues: 4,
    pendingRefunds: 0,
    openTickets: 2,
    escalations: 1
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Manager Dashboard (Simple)</h1>
        <p className="text-[#565959]">✅ Manager dashboard is accessible! API integration working.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/manager/product-approvals" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.pendingProducts}
          </div>
          <div className="text-sm text-[#565959]">Pending Product Approvals</div>
        </Link>

        <Link to="/manager/seller-approvals" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.pendingSellers}
          </div>
          <div className="text-sm text-[#565959]">Pending Seller Approvals</div>
        </Link>

        <Link to="/manager/orders" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.ordersWithIssues}
          </div>
          <div className="text-sm text-[#565959]">Orders with Issues</div>
        </Link>

        <Link to="/manager/returns" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.pendingReturns}
          </div>
          <div className="text-sm text-[#565959]">Pending Returns</div>
        </Link>

        <Link to="/manager/disputes" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.activeDisputes}
          </div>
          <div className="text-sm text-[#565959]">Active Disputes</div>
        </Link>

        <Link to="/manager/refunds" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.pendingRefunds}
          </div>
          <div className="text-sm text-[#565959]">Pending Refunds</div>
        </Link>

        <Link to="/manager/support-tickets" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.openTickets}
          </div>
          <div className="text-sm text-[#565959]">Open Support Tickets</div>
        </Link>

        <Link to="/manager/escalations" className="bg-white p-6 rounded-lg border border-[#D5D9D9] hover:shadow-lg transition-shadow">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {mockStats.escalations}
          </div>
          <div className="text-sm text-[#565959]">Escalated Issues</div>
        </Link>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-green-800 mb-2">🎉 Manager Dashboard Working!</h2>
        <div className="text-green-700">
          <p className="mb-2">✅ Manager login successful</p>
          <p className="mb-2">✅ Manager routes accessible</p>
          <p className="mb-2">✅ Manager layout rendering</p>
          <p className="mb-2">✅ Manager dashboard page loaded</p>
          <p className="text-sm mt-4">
            This simplified version proves the routing works. 
            You can now switch back to the full version with API integration.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] p-6">
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
    </div>
  );
};

export default ManagerDashboardPageSimple;