import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerRefundsPage = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getPendingRefunds();
      setRefunds(data.refunds || []);
    } catch (err) {
      console.error('Error fetching refunds:', err);
      setError(err.message || 'Failed to load refunds');
      toast.error('Failed to load pending refunds');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (refundId) => {
    try {
      await managerAPI.processRefund(refundId, {});
      toast.success('Refund processed successfully');
      fetchRefunds();
    } catch (err) {
      console.error('Error processing refund:', err);
      toast.error(err.message || 'Failed to process refund');
    }
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading refunds...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">💰 Refund Processing</h1>
        <p className="text-[#565959]">Process and manage customer refunds</p>
      </div>

      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Refunds</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button onClick={fetchRefunds} className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]">
              Try Again
            </button>
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">All Caught Up!</h2>
            <p className="text-[#565959]">No pending refunds at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Refund ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-medium text-[#0F1111]">#REF-{refund.id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">#ORD-{refund.order_id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{refund.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 font-semibold text-[#0F1111]">${refund.amount || '0'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{refund.reason || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E5] text-[#F08804]">
                        Pending
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcess(refund.id)}
                          className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54]"
                        >
                          Process
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

export default ManagerRefundsPage;
