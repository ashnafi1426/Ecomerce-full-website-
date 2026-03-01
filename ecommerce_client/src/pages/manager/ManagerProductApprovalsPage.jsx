import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { managerAPI } from '../../services/api.service';

const ManagerProductApprovalsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    seller: '',
    sort: 'newest'
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch approval queue
      const queueResponse = await managerAPI.getApprovalQueue();
      setProducts(queueResponse.products || []);
      
      // Fetch stats from dashboard
      const statsResponse = await managerAPI.getApprovalStats();
      setStats(statsResponse.stats || {});
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products');
      toast.error('Failed to load pending products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    const notes = prompt('Add approval notes (optional):');
    
    try {
      await managerAPI.approveProduct(productId, { comments: notes || 'Approved' });
      toast.success('Product approved successfully');
      fetchProducts();
    } catch (err) {
      console.error('Error approving product:', err);
      toast.error(err.message || 'Failed to approve product');
    }
  };

  const handleReject = async (productId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      toast.error('Rejection reason is required');
      return;
    }
    
    try {
      await managerAPI.rejectProduct(productId, { reason });
      toast.success('Product rejected');
      fetchProducts();
    } catch (err) {
      console.error('Error rejecting product:', err);
      toast.error(err.message || 'Failed to reject product');
    }
  };
  
  const handleRequestChanges = async (productId) => {
    const reason = prompt('What changes are needed?');
    if (!reason) {
      toast.error('Please specify what changes are needed');
      return;
    }

    try {
      await managerAPI.requestChanges(productId, { reason });
      toast.success('Change request sent to seller');
      fetchProducts();
    } catch (err) {
      console.error('Error requesting changes:', err);
      toast.error(err.message || 'Failed to request changes');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9900] mx-auto"></div>
          <p className="mt-4 text-[#565959]">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F1111] mb-2">Product Approvals</h1>
        <p className="text-[#565959]">Review and approve products submitted by sellers</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#FF9900] mb-2">
            {stats.pendingProducts || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Approval</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#067D62] mb-2">
            {stats.pendingSellers || 0}
          </div>
          <div className="text-sm text-[#565959]">Pending Sellers</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#C7511F] mb-2">
            {stats.activeDisputes || 0}
          </div>
          <div className="text-sm text-[#565959]">Active Disputes</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#D5D9D9]">
          <div className="text-4xl font-bold text-[#0F1111] mb-2">
            {stats.ordersWithIssues || 0}
          </div>
          <div className="text-sm text-[#565959]">Orders with Issues</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-[#D5D9D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="home">Home & Kitchen</option>
            <option value="books">Books</option>
            <option value="sports">Sports</option>
            <option value="toys">Toys</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="px-4 py-2 border border-[#D5D9D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden">
        {error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">Failed to Load Products</h2>
            <p className="text-[#565959] mb-6">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-[#FF9900] text-white px-6 py-2 rounded-lg hover:bg-[#F08804] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-[#0F1111] mb-2">All Caught Up!</h2>
            <p className="text-[#565959]">No pending product approvals at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F8F8]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Seller</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Submitted</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#0F1111]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-[#D5D9D9] hover:bg-[#F7F8F8]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[#0F1111]">{product.title}</div>
                          {product.hours_pending && (
                            <div className="text-xs text-[#565959]">
                              Pending for {product.hours_pending}h
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#0F1111]">{product.seller?.display_name || product.seller?.business_name || 'Unknown'}</div>
                      <div className="text-xs text-[#565959]">{product.seller?.email}</div>
                      <div className="text-xs text-[#565959]">{product.seller?.business_name}</div>
                    </td>
                    <td className="px-6 py-4 text-[#0F1111]">{product.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-[#0F1111] font-semibold">${product.price?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-[#565959]">
                      {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Recently'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(product.id)}
                          className="bg-[#067D62] text-white px-3 py-1 rounded text-sm hover:bg-[#056d54] transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(product.id)}
                          className="bg-[#C7511F] text-white px-3 py-1 rounded text-sm hover:bg-[#b04619] transition-colors"
                        >
                          ✗ Reject
                        </button>
                        <button 
                          onClick={() => handleRequestChanges(product.id)}
                          className="bg-[#FF9900] text-white px-3 py-1 rounded text-sm hover:bg-[#F08804] transition-colors"
                        >
                          📝 Request Changes
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

export default ManagerProductApprovalsPage;
