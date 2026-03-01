import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getOrdersWithIssues();
      setOrders(data.orders || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      toast.error('Failed to load orders with issues');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (orderId) => {
    const resolution = prompt('Please provide resolution details:');
    if (!resolution) return;

    try {
      await managerAPI.resolveOrderIssue(orderId, { resolution });
      toast.success('Order issue resolved');
      fetchOrders();
    } catch (err) {
      console.error('Error resolving order:', err);
      toast.error(err.message || 'Failed to resolve order issue');
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Order Monitoring</h1>
        <p className="text-[#565959]">Monitor orders requiring attention or intervention</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.ordersWithIssues || 0}</div>
          <div className="text-sm text-[#565959]">Orders with Issues</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.delayedShipments || 0}</div>
          <div className="text-sm text-[#565959]">Delayed Shipments</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.paymentIssues || 0}</div>
          <div className="text-sm text-[#565959]">Payment Issues</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.escalated || 0}</div>
          <div className="text-sm text-[#565959]">Escalated</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Orders</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button onClick={fetchOrders} className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]">
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">All Orders Running Smoothly!</h2>
            <p className="text-[#565959]">No orders with issues at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Seller</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Issue Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-medium text-[#0F1111]">ORD-{order.id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{order.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{order.seller_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{order.issue_type || 'General Issue'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFE5E5] text-[#C7511F]">
                        Issue
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#565959]">{order.created_at || 'Recently'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8]">
                          View
                        </button>
                        <button
                          onClick={() => handleResolve(order.id)}
                          className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54]"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerOrdersPage;
