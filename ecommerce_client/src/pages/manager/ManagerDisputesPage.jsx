import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerDisputesPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getDisputes();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError(err.message || 'Failed to load disputes');
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId) => {
    const resolution = prompt('Please provide resolution details:');
    if (!resolution) return;

    try {
      await managerAPI.resolveDispute(disputeId, { resolution });
      toast.success('Dispute resolved successfully');
      fetchDisputes();
    } catch (err) {
      console.error('Error resolving dispute:', err);
      toast.error(err.message || 'Failed to resolve dispute');
    }
  };

  const handleEscalate = async (disputeId) => {
    const reason = prompt('Please provide escalation reason:');
    if (!reason) return;

    try {
      await managerAPI.escalateDispute(disputeId, { reason });
      toast.success('Dispute escalated to admin');
      fetchDisputes();
    } catch (err) {
      console.error('Error escalating dispute:', err);
      toast.error(err.message || 'Failed to escalate dispute');
    }
  };

  if (loading && disputes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Dispute Management</h1>
        <p className="text-[#565959]">Manage and resolve customer-seller disputes</p>
      </div>

      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Disputes</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button onClick={fetchDisputes} className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]">
              Try Again
            </button>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">No Active Disputes!</h2>
            <p className="text-[#565959]">All disputes have been resolved</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Dispute ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Seller</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Reason</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-medium text-[#0F1111]">DIS-{dispute.id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">ORD-{dispute.order_id}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{dispute.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{dispute.seller_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{dispute.reason || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E5] text-[#F08804]">
                        {dispute.status || 'Open'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8]">
                          View
                        </button>
                        <button
                          onClick={() => handleResolve(dispute.id)}
                          className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54]"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleEscalate(dispute.id)}
                          className="bg-[#C7511F] text-white px-3 py-1 rounded text-sm hover:bg-[#b04619]"
                        >
                          Escalate
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

export default ManagerDisputesPage;
