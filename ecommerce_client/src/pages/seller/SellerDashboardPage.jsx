import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service.minimal';
import { useChat } from '../../contexts/ChatContext';
import { useSelector } from 'react-redux';
import axios from 'axios';

const SellerDashboardPage = () => {
  const { createConversation, joinConversation } = useChat();
  const { user } = useSelector((state) => state.auth);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    avgRating: 0,
    pendingProducts: 0,
    totalReviews: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get orders and products data (dashboard stats API doesn't exist)
      const [ordersResponse, productsResponse] = await Promise.all([
        sellerAPI.getOrders({ limit: 5, sort: '-createdAt' }),
        sellerAPI.getProducts({ limit: 5, sort: '-createdAt' })
      ]);
      
      console.log('🔍 DASHBOARD DEBUG - Orders response:', ordersResponse);
      console.log('🔍 DASHBOARD DEBUG - Products response:', productsResponse);
      
      // Handle orders response - extract data field
      const ordersData = ordersResponse?.data || ordersResponse || {};
      const orders = ordersData.orders || [];
      
      console.log('🔍 DASHBOARD DEBUG - Extracted orders:', orders);
      console.log('🔍 DASHBOARD DEBUG - Orders count:', orders.length);
      
      // Map sub_orders data to display format with proper amount conversion
      const mappedOrders = orders.map(order => ({
        id: order.id,
        orderId: order.order_id || `#${order.id}`,
        customer: order.orders?.shipping_address?.name || 'Customer',
        product: order.product_name || 'Product',
        amount: order.total_amount ? (order.total_amount / 100).toFixed(2) : '0.00', // Convert cents to dollars
        status: order.fulfillment_status || 'pending',
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
        createdAt: order.created_at
      }));
      
      console.log('🔍 DASHBOARD DEBUG - Mapped orders:', mappedOrders);
      
      setRecentOrders(mappedOrders);
      
      // Handle products response - extract data field
      const productsData = productsResponse?.data || productsResponse || {};
      const products = productsData.products || [];
      
      console.log('🔍 DASHBOARD DEBUG - Extracted products:', products);
      console.log('🔍 DASHBOARD DEBUG - Products count:', products.length);
      
      // Map products data to display format
      const mappedProducts = products.map(product => ({
        id: product.id,
        name: product.title || product.name,
        sku: product.sku || 'N/A',
        price: product.price || 0,
        stock: product.inventory?.quantity || 0,
        status: product.approval_status || product.status || 'pending',
        icon: '📦'
      }));
      
      setProducts(mappedProducts);
      
      // Calculate stats from the actual data
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / 100; // Convert to dollars
      const totalOrders = orders.length;
      const activeProducts = products.filter(p => p.approval_status === 'approved' || p.status === 'active').length;
      const pendingProducts = products.filter(p => p.approval_status === 'pending').length;
      const avgRating = products.reduce((sum, p) => sum + (p.average_rating || 0), 0) / products.length || 0;
      const totalReviews = products.reduce((sum, p) => sum + (p.total_reviews || 0), 0);
      
      console.log('🔍 DASHBOARD DEBUG - Calculated stats:', {
        totalRevenue,
        totalOrders,
        activeProducts,
        pendingProducts,
        avgRating,
        totalReviews
      });
      
      setStats({
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        activeProducts: activeProducts,
        avgRating: avgRating.toFixed(1),
        pendingProducts: pendingProducts,
        totalReviews: totalReviews
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle starting support chat
  const handleContactSupport = async () => {
    if (!user) {
      toast.error('Please login to contact support');
      return;
    }

    try {
      setIsStartingChat(true);

      // Get an available admin/support user
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${API_URL}/chat/support-user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.data && response.data.data.supportUserId) {
        const supportUserId = response.data.data.supportUserId;
        
        // Create conversation with support
        const conversation = await createConversation(supportUserId, {
          type: 'seller_support',
          sellerId: user.id,
          sellerName: user.name || user.email
        });

        // Join the conversation
        joinConversation(conversation.id);

        toast.success('Chat started with support team');
      } else {
        toast.error('No support staff available at the moment');
      }
    } catch (error) {
      console.error('[ContactSupport] Error:', error);
      toast.error('Failed to start chat with support');
    } finally {
      setIsStartingChat(false);
    }
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load dashboard</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchDashboardData} style={styles.retryButton}>
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
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <h1 style={styles.title}>Seller Dashboard</h1>
      <p style={styles.subtitle}>Welcome back! Here's what's happening with your store today.</p>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <div style={styles.statLabel}>Total Revenue</div>
              <div style={styles.statValue}>${stats.totalRevenue.toLocaleString()}</div>
              <div style={styles.statChangePositive}>↑ 12.5% from last month</div>
            </div>
            <div style={styles.statIcon}>💵</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <div style={styles.statLabel}>Total Orders</div>
              <div style={styles.statValue}>{stats.totalOrders}</div>
              <div style={styles.statChangePositive}>↑ 8.3% from last month</div>
            </div>
            <div style={styles.statIcon}>🛍️</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <div style={styles.statLabel}>Active Products</div>
              <div style={styles.statValue}>{stats.activeProducts}</div>
              <div style={styles.statChange}>{stats.pendingProducts} pending approval</div>
            </div>
            <div style={styles.statIcon}>📦</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statHeader}>
            <div>
              <div style={styles.statLabel}>Avg. Rating</div>
              <div style={styles.statValue}>{stats.avgRating}</div>
              <div style={styles.statChangePositive}>⭐ {stats.totalReviews.toLocaleString()} reviews</div>
            </div>
            <div style={styles.statIcon}>⭐</div>
          </div>
        </div>
      </div>

      {/* Help & Support Section */}
      <div style={styles.helpSection}>
        <div style={styles.helpCard}>
          <div style={styles.helpIcon}>💬</div>
          <div style={styles.helpContent}>
            <h3 style={styles.helpTitle}>Need Help?</h3>
            <p style={styles.helpText}>Contact our support team for assistance with your seller account</p>
          </div>
          <button
            onClick={handleContactSupport}
            disabled={isStartingChat}
            style={{
              ...styles.primaryButton,
              opacity: isStartingChat ? 0.6 : 1,
              cursor: isStartingChat ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isStartingChat ? (
              <>
                <span style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Starting...
              </>
            ) : (
              <>
                💬 Contact Support
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Orders</h2>
          <Link to="/seller/orders" style={styles.primaryButton}>
            View All Orders
          </Link>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td style={styles.td}>{order.orderId || order.orderNumber || `#${order.id}`}</td>
                    <td style={styles.td}>{order.customer || order.customerName || 'N/A'}</td>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.productThumb}>{order.productIcon || '📦'}</div>
                        <span>{order.product || order.productName || 'Product'}</span>
                      </div>
                    </td>
                    <td style={styles.td}>${order.amount || order.total || '0.00'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(order.status === 'Processing' || order.status === 'pending' ? styles.badgePending :
                            order.status === 'Shipped' || order.status === 'shipped' ? styles.badgeApproved :
                            styles.badgeApproved)
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>{order.date || new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <Link to={`/seller/orders/${order.id || order._id}`} style={styles.btnSm}>View</Link>
                        {(order.status === 'Processing' || order.status === 'pending') && (
                          <button onClick={() => toast.success('Ship order')} style={styles.btnSm}>Ship</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Status */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Product Status</h2>
          <Link to="/seller/products/add" style={styles.primaryButton}>
            + Add New Product
          </Link>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id || product._id}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.productThumb}>{product.icon || '📦'}</div>
                        <span>{product.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{product.sku || 'N/A'}</td>
                    <td style={styles.td}>${product.price}</td>
                    <td style={styles.td}>{product.stock || product.quantity || 0}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(product.status === 'Active' || product.status === 'active' ? styles.badgeActive :
                            product.status === 'Pending Approval' || product.status === 'pending' ? styles.badgePending :
                            styles.badgeInactive)
                      }}>
                        {product.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <Link to={`/seller/products/edit/${product.id || product._id}`} style={styles.btnSm}>Edit</Link>
                        <Link to={`/seller/products/${product.id || product._id}`} style={styles.btnSm}>View</Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
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
    fontSize: '2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statIcon: {
    fontSize: '2.5em'
  },
  statLabel: {
    fontSize: '0.9em',
    color: '#565959',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '2em',
    fontWeight: 'bold',
    color: '#0F1111'
  },
  statChange: {
    fontSize: '0.85em',
    marginTop: '8px',
    color: '#565959'
  },
  statChangePositive: {
    fontSize: '0.85em',
    marginTop: '8px',
    color: '#067D62'
  },
  helpSection: {
    marginBottom: '30px'
  },
  helpCard: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  helpIcon: {
    fontSize: '3em'
  },
  helpContent: {
    flex: 1
  },
  helpTitle: {
    fontSize: '1.2em',
    fontWeight: 600,
    color: '#0F1111',
    marginBottom: '5px'
  },
  helpText: {
    color: '#565959',
    fontSize: '0.95em'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #F7F8F8'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    color: '#0F1111'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block'
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
    padding: '12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #D5D9D9',
    color: '#0F1111'
  },
  td: {
    padding: '12px',
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
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  badgePending: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgeApproved: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeActive: {
    background: '#E7F3FF',
    color: '#146EB4'
  },
  badgeInactive: {
    background: '#FFE5E5',
    color: '#C7511F'
  },
  actionBtns: {
    display: 'flex',
    gap: '8px'
  },
  btnSm: {
    padding: '6px 12px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em',
    textDecoration: 'none',
    color: '#0F1111'
  }
};

export default SellerDashboardPage;
