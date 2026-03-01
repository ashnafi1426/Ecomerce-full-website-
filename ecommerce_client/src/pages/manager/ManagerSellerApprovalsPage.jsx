import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerSellerApprovalsPage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getPendingSellers();
      setSellers(data.sellers || []);
      setStats(data.stats || {});
    } catch (err) {
      console.error('Error fetching sellers:', err);
      setError(err.message || 'Failed to load sellers');
      toast.error('Failed to load pending sellers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    try {
      await managerAPI.approveSeller(sellerId, {});
      toast.success('Seller approved successfully');
      fetchSellers();
    } catch (err) {
      console.error('Error approving seller:', err);
      toast.error(err.message || 'Failed to approve seller');
    }
  };

  const handleReject = async (sellerId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await managerAPI.rejectSeller(sellerId, { reason });
      toast.success('Seller application rejected');
      fetchSellers();
    } catch (err) {
      console.error('Error rejecting seller:', err);
      toast.error(err.message || 'Failed to reject seller');
    }
  };

  if (loading && sellers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading seller applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Seller Approvals</h1>
        <p className="text-[#565959]">Review and approve seller applications</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats.pendingApplications || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Applications</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats.approvedToday || 0}
          </div>
          <div className="text-sm text-[#565959]">Approved Today</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats.rejectedToday || 0}
          </div>
          <div className="text-sm text-[#565959]">Rejected Today</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats.avgReviewTime || '1.5 days'}
          </div>
          <div className="text-sm text-[#565959]">Avg. Review Time</div>
        </div>
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Applications</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button
              onClick={fetchSellers}
              className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">All Caught Up!</h2>
            <p className="text-[#565959]">No pending seller applications at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Application ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Business Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Contact Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Business Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 text-[#0F1111]">APP-{seller.id}</td>
                    <td className="px-6 py-4 font-medium text-[#0F1111]">{seller.business_name || seller.store_name}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{seller.email}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{seller.business_type || 'Business'}</td>
                    <td className="px-6 py-4 text-[#565959]">{seller.submitted_at || 'Recently'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(seller.id)}
                          className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54] transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(seller.id)}
                          className="bg-[#C7511F] text-white px-3 py-1 rounded text-sm hover:bg-[#b04619] transition-colors"
                        >
                          ✗ Reject
                        </button>
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8] transition-colors">
                          View Details
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

export default ManagerSellerApprovalsPage;
