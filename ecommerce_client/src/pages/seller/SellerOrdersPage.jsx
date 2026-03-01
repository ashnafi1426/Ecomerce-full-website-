import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service.minimal';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [shippingInfo, setShippingInfo] = useState({
    tracking_number: '',
    carrier: '',
    estimated_delivery: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await sellerAPI.getOrders(params);
      console.log('📦 Raw orders API response:', response);
      
      // API returns raw response, extract data field
      const ordersData = response?.data || response || {};
      const orders = ordersData.orders || ordersData.subOrders || [];
      
      console.log('📦 Extracted orders array:', orders);
      
      // Map sub_orders data to display format
      const mappedOrders = orders.map(order => ({
        id: order.id,
        _id: order.id, // Backup ID field
        orderId: order.order_id || `#${order.id}`,
        orderNumber: order.order_id || `#${order.id}`,
        customer: order.orders?.shipping_address?.name || order.customer_name || 'Customer',
        customerName: order.orders?.shipping_address?.name || order.customer_name || 'Customer',
        product: order.product_name || 'Product',
        productName: order.product_name || 'Product',
        amount: order.total_amount || 0,
        total: order.total_amount || 0,
        status: order.fulfillment_status || 'pending',
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
        createdAt: order.created_at
      }));
      
      console.log('📦 Mapped orders for display:', mappedOrders);
      
      setOrders(mappedOrders);
      
      // Calculate stats from orders
      const totalOrders = mappedOrders.length;
      setStats({
        total: totalOrders,
        pending: mappedOrders.filter(o => o.status?.toLowerCase() === 'pending').length,
        processing: mappedOrders.filter(o => o.status?.toLowerCase() === 'processing').length,
        shipped: mappedOrders.filter(o => o.status?.toLowerCase() === 'shipped').length,
        delivered: mappedOrders.filter(o => o.status?.toLowerCase() === 'delivered').length
      });
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load orders</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchOrders} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Orders</h1>
      <p style={styles.subtitle}>Manage and fulfill your customer orders</p>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.processing}</div>
          <div style={styles.statLabel}>Processing</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.shipped}</div>
          <div style={styles.statLabel}>Shipped</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.delivered}</div>
          <div style={styles.statLabel}>Delivered</div>
        </div>
      </div>

      {/* Orders Section */}
      <div style={styles.section}>
        <div style={styles.filterBar}>
          <input
            type="text"
            style={styles.filterInput}
            placeholder="Search orders..."
          />
          <select
            style={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <input type="date" style={styles.filterSelect} />
          <button onClick={() => toast.success('Export CSV')} style={styles.secondaryButton}>
            Export CSV
          </button>
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
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td style={styles.td}>
                      <strong>{order.orderId || order.orderNumber || `#${order.id}`}</strong>
                    </td>
                    <td style={styles.td}>{order.customer || order.customerName || 'N/A'}</td>
                    <td style={styles.td}>{order.product || order.productName || 'Product'}</td>
                    <td style={styles.td}>
                      <strong>${order.amount || order.total || '0.00'}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(order.status === 'Pending' || order.status === 'pending' ? styles.badgePending :
                            order.status === 'Processing' || order.status === 'processing' ? styles.badgeProcessing :
                            order.status === 'Shipped' || order.status === 'shipped' ? styles.badgeShipped :
                            styles.badgeDelivered)
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>{order.date || new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <Link to={`/seller/orders/${order.id || order._id}`} style={styles.btnSm}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#565959' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '3em' }}>📦</span>
                      <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#0F1111' }}>No orders yet</h3>
                        <p style={{ margin: 0, fontSize: '0.9em' }}>
                          Orders will appear here when customers purchase your products
                        </p>
                      </div>
                    </div>
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9'
  },
  statValue: {
    fontSize: '2em',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#FF9900'
  },
  statLabel: {
    fontSize: '0.9em',
    color: '#565959'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
    border: '1px solid #D5D9D9'
  },
  filterBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    flex: 1,
    minWidth: '200px',
    fontSize: '0.95em'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.95em',
    background: '#FFFFFF'
  },
  secondaryButton: {
    padding: '10px 20px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95em',
    color: '#0F1111'
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
  badge: {
    display: 'inline-block',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  badgePending: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgeProcessing: {
    background: '#E7F3FF',
    color: '#146EB4'
  },
  badgeShipped: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeDelivered: {
    background: '#E6F4F1',
    color: '#067D62'
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

export default SellerOrdersPage;
