import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerSellerPerformancePage = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSellerPerformance();
  }, []);

  const fetchSellerPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await managerAPI.getSellerPerformance();
      setSellers(data.sellers || []);
    } catch (err) {
      console.error('Error fetching seller performance:', err);
      setError(err.message || 'Failed to load seller performance');
      toast.error('Failed to load seller performance data');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (performance) => {
    const badges = {
      excellent: 'bg-[#E6F4F1] text-[#067D62]',
      good: 'bg-[#E7F3FF] text-[#146EB4]',
      warning: 'bg-[#FFF4E5] text-[#F08804]',
      poor: 'bg-[#FFE5E5] text-[#C7511F]'
    };
    return badges[performance?.toLowerCase()] || badges.good;
  };

  if (loading && sellers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading seller performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">🏪 Seller Performance</h1>
        <p className="text-[#565959]">Monitor and analyze seller performance metrics</p>
      </div>

      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Seller Performance</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button
              onClick={fetchSellerPerformance}
              className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804]"
            >
              Try Again
            </button>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">No Seller Data</h2>
            <p className="text-[#565959]">No seller performance data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Seller</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Orders</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Revenue</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">On-Time Delivery</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Return Rate</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Performance</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4 font-semibold text-[#0F1111]">{seller.store_name || seller.business_name}</td>
                    <td className="px-6 py-4 text-[#0F1111]">⭐ {seller.rating || '4.5'}/5</td>
                    <td className="px-6 py-4 text-[#0F1111]">{seller.total_orders || 0}</td>
                    <td className="px-6 py-4 text-[#0F1111]">${seller.total_revenue || '0'}</td>
                    <td className="px-6 py-4 text-[#0F1111]">{seller.on_time_delivery || '95'}%</td>
                    <td className="px-6 py-4 text-[#0F1111]">{seller.return_rate || '2.5'}%</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPerformanceBadge(seller.performance)}`}>
                        {seller.performance || 'Good'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="border border-[#D5D9D9] px-3 py-1 rounded text-sm hover:bg-[#F7F8F8]">
                          View Details
                        </button>
                        {seller.performance === 'poor' && (
                          <button className="bg-[#C7511F] text-white px-3 py-1 rounded text-sm hover:bg-[#b04619]">
                            Warning
                          </button>
                        )}
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

export default ManagerSellerPerformancePage;
