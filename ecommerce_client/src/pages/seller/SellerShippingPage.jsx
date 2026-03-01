import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerShippingPage = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getShippingQueue();
      setShipments(response.shipments || []);
    } catch (err) {
      setError(err.message || 'Failed to load shipments');
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLabel = async (orderId) => {
    try {
      await sellerAPI.generateLabel(orderId);
      toast.success(`Printing label for ${orderId}...`);
      fetchShipments();
    } catch (err) {
      toast.error('Failed to generate label');
    }
  };

  const handleMarkShipped = async (orderId) => {
    try {
      await sellerAPI.markAsShipped(orderId, {});
      toast.success(`Order ${orderId} marked as shipped`);
      fetchShipments();
    } catch (err) {
      toast.error('Failed to mark as shipped');
    }
  };

  const handleTrack = (trackingNumber) => {
    toast.info(`Tracking: ${trackingNumber}`);
  };

  const handleBulkPrint = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to print');
      return;
    }
    toast.success(`Printing ${selectedItems.length} labels...`);
  };

  const handleExport = () => {
    toast.success('Exporting shipment data...');
  };

  const handleCarrierChange = (orderId, carrier) => {
    setShipments(shipments.map(item =>
      item.orderId === orderId ? { ...item, carrier } : item
    ));
    toast.success(`Carrier updated to ${carrier}`);
  };

  const filteredShipments = shipments.filter(item => {
    const matchesSearch = item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.trackingNumber && item.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase().replace(' ', '') === statusFilter;
    const matchesCarrier = carrierFilter === 'all' || item.carrier.toLowerCase() === carrierFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCarrier;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load shipments</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchShipments} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Shipping Management</h1>
      <p style={styles.subtitle}>Manage shipping labels, tracking numbers, and carrier selection</p>

      {/* Page Actions */}
      <div style={styles.pageActions}>
        <div style={styles.searchFilter}>
          <input
            type="text"
            placeholder="Search by order ID or tracking number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="pendinglabel">Pending Label</option>
            <option value="labelprinted">Label Printed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Carriers</option>
            <option value="fedex">FedEx</option>
            <option value="ups">UPS</option>
            <option value="usps">USPS</option>
            <option value="dhl">DHL</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExport} style={styles.secondaryButton}>
            📥 Export
          </button>
          <button onClick={handleBulkPrint} style={styles.primaryButton}>
            🖨️ Bulk Print Labels
          </button>
        </div>
      </div>

      {/* Shipping Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Orders Ready to Ship</h2>
          <span style={{ color: '#565959' }}>12 orders pending shipment</span>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredShipments.map(item => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </th>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Destination</th>
                <th style={styles.th}>Carrier</th>
                <th style={styles.th}>Tracking Number</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length > 0 ? (
                filteredShipments.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </td>
                    <td style={styles.td}><strong>{item.orderId}</strong></td>
                    <td style={styles.td}>{item.customer}</td>
                    <td style={styles.td}>{item.destination}</td>
                    <td style={styles.td}>
                      <select
                        value={item.carrier}
                        onChange={(e) => handleCarrierChange(item.orderId, e.target.value)}
                        style={styles.carrierSelect}
                      >
                        <option value="FedEx">FedEx</option>
                        <option value="UPS">UPS</option>
                        <option value="USPS">USPS</option>
                        <option value="DHL">DHL</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      {item.trackingNumber ? (
                        <span style={styles.trackingNumber}>{item.trackingNumber}</span>
                      ) : (
                        <span style={{ color: '#565959' }}>Not generated</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(item.status === 'Pending Label' ? styles.badgePending :
                            item.status === 'Label Printed' ? styles.badgeLabelPrinted :
                            item.status === 'Shipped' ? styles.badgeShipped :
                            styles.badgeDelivered)
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        {item.status === 'Pending Label' && (
                          <button
                            onClick={() => handlePrintLabel(item.orderId)}
                            style={{ ...styles.btnSm, ...styles.btnPrint }}
                          >
                            🖨️ Print Label
                          </button>
                        )}
                        {item.status === 'Label Printed' && (
                          <>
                            <button onClick={() => handlePrintLabel(item.orderId)} style={styles.btnSm}>
                              🔄 Reprint
                            </button>
                            <button
                              onClick={() => handleMarkShipped(item.orderId)}
                              style={{ ...styles.btnSm, ...styles.btnPrint }}
                            >
                              Mark Shipped
                            </button>
                          </>
                        )}
                        {(item.status === 'Shipped' || item.status === 'Delivered') && (
                          <button onClick={() => handleTrack(item.trackingNumber)} style={styles.btnSm}>
                            📍 Track
                          </button>
                        )}
                        <button onClick={() => toast.info('View order')} style={styles.btnSm}>
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No shipments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Carrier Information */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Carrier Information</h2>
        </div>
        <div style={styles.carrierGrid}>
          <div style={styles.carrierCard}>
            <div style={styles.carrierIcon}>📦</div>
            <h3 style={styles.carrierTitle}>FedEx</h3>
            <p style={styles.carrierText}>Fast and reliable shipping</p>
            <p style={styles.carrierAccount}>Account: FDX-123456</p>
          </div>
          <div style={styles.carrierCard}>
            <div style={styles.carrierIcon}>📮</div>
            <h3 style={styles.carrierTitle}>UPS</h3>
            <p style={styles.carrierText}>Worldwide delivery service</p>
            <p style={styles.carrierAccount}>Account: UPS-789012</p>
          </div>
          <div style={styles.carrierCard}>
            <div style={styles.carrierIcon}>✉️</div>
            <h3 style={styles.carrierTitle}>USPS</h3>
            <p style={styles.carrierText}>US Postal Service</p>
            <p style={styles.carrierAccount}>Account: USPS-345678</p>
          </div>
          <div style={styles.carrierCard}>
            <div style={styles.carrierIcon}>🌍</div>
            <h3 style={styles.carrierTitle}>DHL</h3>
            <p style={styles.carrierText}>International shipping</p>
            <p style={styles.carrierAccount}>Account: DHL-901234</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px',
    textAlign: 'center'
  },
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
    maxWidth: '600px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px'
  },
  filterSelect: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  secondaryButton: {
    background: '#FFFFFF',
    color: '#0F1111',
    border: '1px solid #D5D9D9',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '12px',
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
  carrierSelect: {
    padding: '8px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.9em'
  },
  trackingNumber: {
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
    color: '#146EB4'
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
  badgeLabelPrinted: {
    background: '#F0E6FF',
    color: '#6B46C1'
  },
  badgeShipped: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeDelivered: {
    background: '#E7F3FF',
    color: '#146EB4'
  },
  actionBtns: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  btnSm: {
    padding: '6px 14px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em',
    whiteSpace: 'nowrap'
  },
  btnPrint: {
    background: '#FF9900',
    color: '#FFFFFF',
    borderColor: '#FF9900'
  },
  carrierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  carrierCard: {
    padding: '20px',
    background: '#F7F8F8',
    borderRadius: '8px'
  },
  carrierIcon: {
    fontSize: '2em',
    marginBottom: '10px'
  },
  carrierTitle: {
    marginBottom: '8px',
    color: '#0F1111'
  },
  carrierText: {
    color: '#565959',
    fontSize: '0.9em',
    marginBottom: '10px'
  },
  carrierAccount: {
    fontWeight: 'bold',
    color: '#0F1111'
  }
};

export default SellerShippingPage;
