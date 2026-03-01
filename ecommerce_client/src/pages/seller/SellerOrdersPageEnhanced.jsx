import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service.minimal';
import { PLACEHOLDERS } from '../../utils/imagePlaceholder';

const SellerOrdersPageEnhanced = () => {
  // State management
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
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Selection and bulk actions
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  
  // Shipping info state
  const [shippingInfo, setShippingInfo] = useState({
    tracking_number: '',
    carrier: '',
    estimated_delivery: '',
    note: ''
  });

  // Fetch orders on mount and filter change
  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Apply filters when search or date changes
  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, dateFrom, dateTo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (statusFilter !== 'all') {
        params.fulfillment_status = statusFilter;
      }
      
      const response = await sellerAPI.getOrders(params);
      const ordersData = response?.data || response || {};
      const fetchedOrders = ordersData.orders || ordersData.subOrders || [];
      
      // Map sub_orders data to display format
      const mappedOrders = fetchedOrders.map(order => ({
        id: order.id,
        orderId: order.order_id || `#${order.id}`,
        parentOrderId: order.parent_order_id,
        customer: order.orders?.shipping_address?.name || order.customer_name || 'Customer',
        customerEmail: order.orders?.users?.email || 'N/A',
        product: order.product_name || 'Product',
        productImage: order.product_image_url || PLACEHOLDERS.productSmall,
        productSku: order.product_sku || 'N/A',
        amount: order.total_amount || 0,
        status: order.fulfillment_status || 'pending',
        payoutStatus: order.payout_status || 'pending',
        trackingNumber: order.tracking_number || null,
        carrier: order.carrier || null,
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
        createdAt: order.created_at,
        shippedAt: order.shipped_at
      }));
      
      setOrders(mappedOrders);
      calculateStats(mappedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    setStats({
      total: ordersList.length,
      pending: ordersList.filter(o => o.status === 'pending').length,
      confirmed: ordersList.filter(o => o.status === 'confirmed').length,
      shipped: ordersList.filter(o => o.status === 'shipped').length,
      delivered: ordersList.filter(o => o.status === 'delivered').length,
      cancelled: ordersList.filter(o => o.status === 'cancelled').length
    });
  };

  const applyFilters = () => {
    let filtered = [...orders];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderId.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.product.toLowerCase().includes(query) ||
        order.productSku.toLowerCase().includes(query)
      );
    }
    
    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(dateFrom);
      });
    }
    
    if (dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate <= new Date(dateTo);
      });
    }
    
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // Get valid next statuses based on current status
  const getValidNextStatuses = (currentStatus) => {
    const transitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [], // Final state
      'cancelled': [] // Final state
    };
    
    return transitions[currentStatus] || [];
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus('');
    setStatusNote('');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
    setNewStatus('');
    setStatusNote('');
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      await sellerAPI.updateOrderStatus(selectedOrder.id, { status: newStatus });
      toast.success('Order status updated successfully');
      closeStatusModal();
      fetchOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const openShippingModal = (order) => {
    setSelectedOrder(order);
    setShippingInfo({
      tracking_number: '',
      carrier: '',
      estimated_delivery: '',
      note: ''
    });
    setShowShippingModal(true);
  };

  const closeShippingModal = () => {
    setShowShippingModal(false);
    setSelectedOrder(null);
    setShippingInfo({
      tracking_number: '',
      carrier: '',
      estimated_delivery: '',
      note: ''
    });
  };

  const handleAddShipping = async () => {
    if (!shippingInfo.tracking_number || !shippingInfo.carrier) {
      toast.error('Please provide tracking number and carrier');
      return;
    }

    try {
      await sellerAPI.addShippingInfo(selectedOrder.id, shippingInfo);
      toast.success('Shipping information added successfully');
      closeShippingModal();
      fetchOrders();
    } catch (err) {
      console.error('Error adding shipping info:', err);
      toast.error(err.message || 'Failed to add shipping information');
    }
  };

  const handleExportCSV = () => {
    const dataToExport = filteredOrders.length > 0 ? filteredOrders : orders;
    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, 'orders-export.csv');
    toast.success('Orders exported successfully');
  };

  const convertToCSV = (data) => {
    const headers = ['Order ID', 'Customer', 'Email', 'Product', 'Amount', 'Status', 'Date'];
    const rows = data.map(order => [
      order.orderId,
      order.customer,
      order.customerEmail,
      order.product,
      `$${order.amount}`,
      order.status,
      order.date
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination logic
  const displayOrders = filteredOrders.length > 0 ? filteredOrders : orders;
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const paginatedOrders = displayOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(displayOrders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>📦 Order Management</h1>
        <p style={styles.pageSubtitle}>Manage and fulfill your customer orders efficiently</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Orders</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
          <div style={styles.statChange}>Needs attention</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.confirmed}</div>
          <div style={styles.statLabel}>Confirmed</div>
          <div style={styles.statChange}>Ready to ship</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.shipped}</div>
          <div style={styles.statLabel}>Shipped</div>
          <div style={styles.statChange}>In transit</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.delivered}</div>
          <div style={styles.statLabel}>Delivered</div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search Orders</label>
            <input
              type="text"
              style={styles.filterInput}
              placeholder="Order ID, customer name, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select
              style={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date From</label>
            <input
              type="date"
              style={styles.filterInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date To</label>
            <input
              type="date"
              style={styles.filterInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>&nbsp;</label>
            <button onClick={handleExportCSV} style={styles.secondaryButton}>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={styles.ordersSection}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitle}>Orders ({displayOrders.length})</div>
          {selectedOrders.length > 0 && (
            <div style={styles.bulkActions}>
              <span style={{ fontSize: '14px', color: '#565959' }}>
                {selectedOrders.length} selected
              </span>
              <button style={styles.secondaryButton}>Export Selected</button>
            </div>
          )}
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
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
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order.id} style={styles.tr}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </td>
                    <td style={styles.td}>
                      <span style={styles.orderId}>{order.orderId}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.customerInfo}>
                        <span style={styles.customerName}>{order.customer}</span>
                        <span style={styles.customerEmail}>{order.customerEmail}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.productInfo}>
                        <img
                          src={order.productImage}
                          alt={order.product}
                          style={styles.productImage}
                        />
                        <div style={styles.productDetails}>
                          <span style={styles.productName}>{order.product}</span>
                          <span style={styles.productSku}>SKU: {order.productSku}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.amount}>${order.amount.toFixed(2)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(order.status === 'pending' ? styles.badgePending :
                            order.status === 'confirmed' ? styles.badgeConfirmed :
                            order.status === 'shipped' ? styles.badgeShipped :
                            order.status === 'delivered' ? styles.badgeDelivered :
                            styles.badgeCancelled)
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>{order.date}</td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        {/* Show action buttons based on valid transitions */}
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openStatusModal(order)}
                              style={styles.btnSmPrimary}
                              title="Confirm this order"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => openStatusModal(order)}
                              style={styles.btnSm}
                              title="Cancel this order"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => openShippingModal(order)}
                              style={styles.btnSmPrimary}
                              title="Add shipping information"
                            >
                              Ship Order
                            </button>
                            <button
                              onClick={() => openStatusModal(order)}
                              style={styles.btnSm}
                              title="Cancel this order"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'shipped' && (
                          <>
                            <button
                              onClick={() => openStatusModal(order)}
                              style={styles.btnSmPrimary}
                              title="Mark as delivered"
                            >
                              Mark Delivered
                            </button>
                            {order.trackingNumber && (
                              <button 
                                style={styles.btnSm}
                                title={`Track with ${order.carrier}: ${order.trackingNumber}`}
                              >
                                Track
                              </button>
                            )}
                          </>
                        )}
                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                          <span style={{ fontSize: '13px', color: '#565959', fontStyle: 'italic' }}>
                            No actions available
                          </span>
                        )}
                        <Link 
                          to={`/seller/orders/${order.id}`} 
                          style={styles.btnSm}
                          title="View order details"
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '60px' }}>
                    <div style={styles.emptyState}>
                      <span style={styles.emptyIcon}>📦</span>
                      <h3 style={styles.emptyTitle}>No orders found</h3>
                      <p style={styles.emptyText}>
                        {searchQuery || dateFrom || dateTo
                          ? 'Try adjusting your filters'
                          : 'Orders will appear here when customers purchase your products'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={styles.pagination}>
            <div style={styles.paginationInfo}>
              Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, displayOrders.length)} of {displayOrders.length} orders
            </div>
            <div style={styles.paginationControls}>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={styles.pageBtn}
              >
                Previous
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    style={{
                      ...styles.pageBtn,
                      ...(currentPage === pageNumber ? styles.pageBtnActive : {})
                    }}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={styles.pageBtn}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {showStatusModal && (
        <div style={styles.modal} onClick={closeStatusModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Order Status</h2>
              <button onClick={closeStatusModal} style={styles.modalClose}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Order ID</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={selectedOrder?.orderId}
                  readOnly
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Current Status</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={selectedOrder?.status}
                  readOnly
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>New Status *</label>
                <select
                  style={styles.formSelect}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select status...</option>
                  {getValidNextStatuses(selectedOrder?.status).map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                {getValidNextStatuses(selectedOrder?.status).length === 0 && (
                  <p style={{ fontSize: '13px', color: '#B12704', marginTop: '8px' }}>
                    ⚠️ This order is in a final state and cannot be changed.
                  </p>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Note (Optional)</label>
                <textarea
                  style={styles.formTextarea}
                  placeholder="Add any notes about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeStatusModal} style={styles.secondaryButton}>
                Cancel
              </button>
              <button onClick={handleUpdateStatus} style={styles.primaryButton}>
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shipping Modal */}
      {showShippingModal && (
        <div style={styles.modal} onClick={closeShippingModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Shipping Information</h2>
              <button onClick={closeShippingModal} style={styles.modalClose}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Order ID</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={selectedOrder?.orderId}
                  readOnly
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Carrier *</label>
                <select
                  style={styles.formSelect}
                  value={shippingInfo.carrier}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, carrier: e.target.value })}
                >
                  <option value="">Select carrier...</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Tracking Number *</label>
                <input
                  type="text"
                  style={styles.formInput}
                  placeholder="Enter tracking number"
                  value={shippingInfo.tracking_number}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, tracking_number: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Estimated Delivery</label>
                <input
                  type="date"
                  style={styles.formInput}
                  value={shippingInfo.estimated_delivery}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, estimated_delivery: e.target.value })}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Shipping Note (Optional)</label>
                <textarea
                  style={styles.formTextarea}
                  placeholder="Add any shipping notes..."
                  value={shippingInfo.note}
                  onChange={(e) => setShippingInfo({ ...shippingInfo, note: e.target.value })}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeShippingModal} style={styles.secondaryButton}>
                Cancel
              </button>
              <button onClick={handleAddShipping} style={styles.primaryButton}>
                Add Shipping Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1500px',
    margin: '0 auto'
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
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
  },
  pageHeader: {
    background: '#FFFFFF',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    color: '#0F1111'
  },
  pageSubtitle: {
    color: '#565959',
    fontSize: '14px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#FF9900',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#565959',
    fontWeight: '500'
  },
  statChange: {
    fontSize: '12px',
    marginTop: '8px',
    color: '#565959'
  },
  filtersSection: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  filtersRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
    gap: '12px',
    alignItems: 'end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0F1111'
  },
  filterInput: {
    padding: '10px 12px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#FFFFFF'
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#FFFFFF'
  },
  secondaryButton: {
    padding: '10px 20px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    color: '#0F1111'
  },
  primaryButton: {
    padding: '10px 20px',
    border: 'none',
    background: '#FF9900',
    color: '#FFFFFF',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  ordersSection: {
    background: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  sectionHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #D5D9D9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0F1111'
  },
  bulkActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
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
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    color: '#0F1111',
    borderBottom: '2px solid #D5D9D9'
  },
  tr: {
    transition: 'background 0.2s'
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #E7E9EC',
    fontSize: '14px'
  },
  orderId: {
    fontWeight: '600',
    color: '#007185'
  },
  customerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  customerName: {
    fontWeight: '600'
  },
  customerEmail: {
    fontSize: '12px',
    color: '#565959'
  },
  productInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  productImage: {
    width: '50px',
    height: '50px',
    objectFit: 'cover',
    borderRadius: '4px',
    border: '1px solid #D5D9D9'
  },
  productDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  productName: {
    fontWeight: '500',
    color: '#0F1111'
  },
  productSku: {
    fontSize: '12px',
    color: '#565959'
  },
  amount: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#0F1111'
  },
  badge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  badgePending: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgeConfirmed: {
    background: '#E7F3FF',
    color: '#146EB4'
  },
  badgeShipped: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeDelivered: {
    background: '#D5F5E3',
    color: '#0F5132'
  },
  badgeCancelled: {
    background: '#F8D7DA',
    color: '#B12704'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  btnSm: {
    padding: '6px 12px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    color: '#0F1111',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block'
  },
  btnSmPrimary: {
    padding: '6px 12px',
    fontSize: '13px',
    borderRadius: '6px',
    border: 'none',
    background: '#FF9900',
    color: '#FFFFFF',
    cursor: 'pointer'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderTop: '1px solid #D5D9D9'
  },
  paginationInfo: {
    fontSize: '14px',
    color: '#565959'
  },
  paginationControls: {
    display: 'flex',
    gap: '8px'
  },
  pageBtn: {
    padding: '8px 12px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  pageBtnActive: {
    background: '#FF9900',
    color: '#FFFFFF',
    borderColor: '#FF9900'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalContent: {
    background: '#FFFFFF',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #D5D9D9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0F1111'
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#565959',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },
  modalBody: {
    padding: '24px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  formLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0F1111',
    marginBottom: '8px'
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px'
  },
  modalFooter: {
    padding: '20px 24px',
    borderTop: '1px solid #D5D9D9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  emptyIcon: {
    fontSize: '64px'
  },
  emptyTitle: {
    margin: '0 0 10px 0',
    color: '#0F1111',
    fontSize: '20px',
    fontWeight: '700'
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    color: '#565959',
    maxWidth: '400px'
  }
};

export default SellerOrdersPageEnhanced;
