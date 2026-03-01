import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service.minimal';

const SellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [statusFilter, approvalFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (approvalFilter !== 'all') {
        params.approvalStatus = approvalFilter;
      }
      
      console.log('🔍 SellerProductsPage: Fetching products with params:', params);
      const response = await sellerAPI.getProducts(params);
      console.log('✅ SellerProductsPage: API response:', response);
      
      const extractedProducts = response.data?.products || response.products || [];
      console.log('✅ SellerProductsPage: Extracted products:', extractedProducts.length);
      
      setProducts(extractedProducts);
    } catch (err) {
      console.error('❌ SellerProductsPage: Error fetching products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await sellerAPI.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const filteredProducts = products.filter(product => {
    const productName = product.name || product.title || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load products</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchProducts} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Products</h1>
      <p style={styles.subtitle}>Manage your product catalog</p>

      {/* Page Actions */}
      <div style={styles.pageActions}>
        <div style={styles.searchFilter}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            style={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            style={styles.filterSelect}
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => toast.success('Export CSV')} style={styles.secondaryButton}>
            Export CSV
          </button>
          <Link to="/seller/products/add" style={styles.primaryButton}>
            + Add Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div style={styles.section}>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input type="checkbox" />
                </th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id || product._id}>
                    <td style={styles.td}>
                      <input type="checkbox" />
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.productThumb}>{product.icon || '📦'}</div>
                        <span>{product.name || product.title}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{product.sku || 'N/A'}</td>
                    <td style={styles.td}>${product.price}</td>
                    <td style={styles.td}>{product.stock || product.quantity || product.inventory?.quantity || 0}</td>
                    <td style={styles.td}>
                      {/* Approval Status Badge */}
                      {product.approval_status ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            ...styles.badge,
                            ...(product.approval_status === 'approved' ? styles.badgeApproved :
                                product.approval_status === 'pending' ? styles.badgePendingApproval :
                                product.approval_status === 'rejected' ? styles.badgeRejected :
                                product.approval_status === 'changes_requested' ? styles.badgeChangesRequested :
                                styles.badgeInactive)
                          }}>
                            {product.approval_status === 'approved' && '✓ Approved'}
                            {product.approval_status === 'pending' && '⏳ Pending Approval'}
                            {product.approval_status === 'rejected' && '✗ Rejected'}
                            {product.approval_status === 'changes_requested' && '📝 Changes Requested'}
                          </span>
                          {product.rejection_reason && (
                            <span style={{ fontSize: '11px', color: '#C7511F', fontStyle: 'italic' }}>
                              {product.rejection_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{
                          ...styles.badge,
                          ...(product.status === 'active' ? styles.badgeActive :
                              product.status === 'inactive' ? styles.badgeInactive :
                              styles.badgeInactive)
                        }}>
                          {product.status === 'active' ? 'Active' : 
                           product.status === 'inactive' ? 'Inactive' : 
                           product.status || 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <Link to={`/seller/products/edit/${product.id || product._id}`} style={styles.btnSm}>
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(product.id || product._id)} style={styles.btnSm}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No products found. <Link to="/seller/products/add" style={{ color: '#FF9900' }}>Add your first product</Link>
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

const styles = {
  container: {
    padding: '30px'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px'
  },
  spinner: {
    fontSize: '1.2em',
    color: '#565959'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    padding: '40px'
  },
  retryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
  },
  title: {
    fontSize: '2.2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px',
    fontSize: '1.05em'
  },
  pageActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px'
  },
  searchFilter: {
    display: 'flex',
    gap: '15px',
    flex: 1,
    maxWidth: '800px'
  },
  searchInput: {
    flex: 2,
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.95em'
  },
  filterSelect: {
    flex: 1,
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.95em',
    background: '#FFFFFF',
    minWidth: '140px'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.2s'
  },
  secondaryButton: {
    background: '#FFFFFF',
    color: '#0F1111',
    border: '1px solid #D5D9D9',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #D5D9D9'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    background: '#F7F8F8',
    padding: '14px 12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #D5D9D9',
    fontSize: '0.9em',
    color: '#0F1111'
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #D5D9D9',
    color: '#0F1111'
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  productThumb: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5em'
  },
  badge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  badgeActive: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgePending: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgeInactive: {
    background: '#FFE5E5',
    color: '#C7511F'
  },
  // Approval status badges
  badgeApproved: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgePendingApproval: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgeRejected: {
    background: '#FFE5E5',
    color: '#C7511F'
  },
  badgeChangesRequested: {
    background: '#FFF4E5',
    color: '#FF9900'
  },
  actionBtns: {
    display: 'flex',
    gap: '8px'
  },
  btnSm: {
    padding: '6px 14px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em',
    textDecoration: 'none',
    color: '#0F1111'
  }
};

export default SellerProductsPage;
