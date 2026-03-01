import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getPendingReturns();
      setReturns(data.returns || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Error fetching returns:', err);
      setError(err.message || 'Failed to load returns');
      toast.error('Failed to load pending returns');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId) => {
    try {
      await managerAPI.approveReturn(returnId, {});
      toast.success('Return approved successfully');
      fetchReturns();
    } catch (err) {
      console.error('Error approving return:', err);
      toast.error(err.message || 'Failed to approve return');
    }
  };

  const handleReject = async (returnId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await managerAPI.rejectReturn(returnId, { reason });
      toast.success('Return rejected');
      fetchReturns();
    } catch (err) {
      console.error('Error rejecting return:', err);
      toast.error(err.message || 'Failed to reject return');
    }
  };

  if (loading && returns.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Return Requests</h1>
        <p className="text-[#565959]">Review and process customer return requests</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.pendingReturns || 0}</div>
          <div className="text-sm text-[#565959]">Pending Returns</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.approvedToday || 0}</div>
          <div className="text-sm text-[#565959]">Approved Today</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">{stats.rejectedToday || 0}</div>
          <div className="text-sm text-[#565959]">Rejected Today</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">${stats.returnValue || '0'}</div>
          <div className="text-sm text-[#565959]">Return Value</div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Returns</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button onClick={fetchReturns} className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]">
              Try Again
            </button>
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">All Caught Up!</h2>
            <p className="text-[#565959]">No pending return requests at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Return ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnItem) => (
                  <tr key={returnItem.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-medium text-[#0F1111]">RET-{returnItem.id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">ORD-{returnItem.order_id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{returnItem.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{returnItem.product_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{returnItem.reason || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-[#0F1111]">${returnItem.amount || '0'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E5] text-[#F08804]">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(returnItem.id)}
                          className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54]"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(returnItem.id)}
                          className="bg-[#C7511F] text-white px-3 py-1 rounded text-sm hover:bg-[#b04619]"
                        >
                          ✗ Reject
                        </button>
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8]">
                          View
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

export default ManagerReturnsPage;
