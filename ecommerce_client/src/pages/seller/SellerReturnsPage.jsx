import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerReturnsPage = () => {
  const [stats, setStats] = useState({
    pending: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    returnRate: 0
  });
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getReturns();
      
      setReturns(response.returns || []);
      setStats({
        pending: response.stats?.pending || 0,
        approvedThisMonth: response.stats?.approvedThisMonth || 0,
        rejectedThisMonth: response.stats?.rejectedThisMonth || 0,
        returnRate: response.stats?.returnRate || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to load returns');
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId) => {
    try {
      await sellerAPI.approveReturn(returnId);
      toast.success(`Return ${returnId} approved`);
      fetchReturns();
    } catch (err) {
      toast.error('Failed to approve return');
    }
  };

  const handleReject = async (returnId) => {
    try {
      await sellerAPI.rejectReturn(returnId, 'Reason for rejection');
      toast.error(`Return ${returnId} rejected`);
      fetchReturns();
    } catch (err) {
      toast.error('Failed to reject return');
    }
  };

  const handleExport = () => {
    toast.success('Exporting returns data...');
  };

  const filteredReturns = returns.filter(item => {
    const matchesSearch = item.returnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase().replace(' ', '') === statusFilter;
    const matchesReason = reasonFilter === 'all' || item.reason.toLowerCase() === reasonFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesReason;
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
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load returns</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchReturns} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Returns Management</h1>
      <p style={styles.subtitle}>Review and manage return requests from customers</p>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Pending Returns</div>
          <div style={styles.statValue}>{stats.pending}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Approved This Month</div>
          <div style={styles.statValue}>{stats.approvedThisMonth}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Rejected This Month</div>
          <div style={styles.statValue}>{stats.rejectedThisMonth}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Return Rate</div>
          <div style={styles.statValue}>{stats.returnRate}%</div>
        </div>
      </div>

      {/* Page Actions */}
      <div style={styles.pageActions}>
        <div style={styles.searchFilter}>
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
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
            <option value="pendingreview">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Reasons</option>
            <option value="defective">Defective</option>
            <option value="wrongitem">Wrong Item</option>
            <option value="notasdescribed">Not as Described</option>
            <option value="changedmind">Changed Mind</option>
          </select>
        </div>
        <button onClick={handleExport} style={styles.secondaryButton}>
          📥 Export
        </button>
      </div>

      {/* Returns Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Return Requests</h2>
          <span style={{ color: '#565959' }}>{stats.pending} requests pending review</span>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Return ID</th>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length > 0 ? (
                filteredReturns.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}><strong>{item.returnId}</strong></td>
                    <td style={styles.td}>{item.orderId}</td>
                    <td style={styles.td}>{item.customer}</td>
                    <td style={styles.td}>{item.product}</td>
                    <td style={styles.td}>
                      <span style={styles.returnReason}>{item.reasonDetail}</span>
                    </td>
                    <td style={styles.td}>${item.amount}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(item.status === 'Pending Review' ? styles.badgePending :
                            item.status === 'Approved' ? styles.badgeApproved :
                            item.status === 'Rejected' ? styles.badgeRejected :
                            styles.badgeCompleted)
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={styles.td}>{item.date}</td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        {item.status === 'Pending Review' && (
                          <>
                            <button
                              onClick={() => handleApprove(item.returnId)}
                              style={{ ...styles.btnSm, ...styles.btnApprove }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReject(item.returnId)}
                              style={{ ...styles.btnSm, ...styles.btnReject }}
                            >
                              ✗ Reject
                            </button>
                          </>
                        )}
                        <button onClick={() => toast.info('View details')} style={styles.btnSm}>
                          View
                        </button>
                        {item.status === 'Approved' && (
                          <button onClick={() => toast.info('Track return')} style={styles.btnSm}>
                            Track Return
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No returns found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Policy */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Return Policy Guidelines</h2>
        </div>
        <div style={styles.policyGrid}>
          <div style={styles.policyCard}>
            <div style={styles.policyIcon}>📅</div>
            <h3 style={styles.policyTitle}>30-Day Window</h3>
            <p style={styles.policyText}>Returns must be requested within 30 days of delivery</p>
          </div>
          <div style={styles.policyCard}>
            <div style={styles.policyIcon}>📦</div>
            <h3 style={styles.policyTitle}>Original Condition</h3>
            <p style={styles.policyText}>Items must be unused and in original packaging</p>
          </div>
          <div style={styles.policyCard}>
            <div style={styles.policyIcon}>💰</div>
            <h3 style={styles.policyTitle}>Full Refund</h3>
            <p style={styles.policyText}>Approved returns receive full refund within 5-7 days</p>
          </div>
          <div style={styles.policyCard}>
            <div style={styles.policyIcon}>🚚</div>
            <h3 style={styles.policyTitle}>Free Return Shipping</h3>
            <p style={styles.policyText}>Prepaid return labels for defective items</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
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
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '40px',
    textAlign: 'center'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
  },
  container: {
    padding: '30px'
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9'
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
  returnReason: {
    fontSize: '0.9em',
    color: '#565959',
    fontStyle: 'italic'
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
  badgeApproved: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeRejected: {
    background: '#FFE5E5',
    color: '#C7511F'
  },
  badgeCompleted: {
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
  btnApprove: {
    background: '#067D62',
    color: '#FFFFFF',
    borderColor: '#067D62'
  },
  btnReject: {
    background: '#C7511F',
    color: '#FFFFFF',
    borderColor: '#C7511F'
  },
  policyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  policyCard: {
    padding: '20px',
    background: '#F7F8F8',
    borderRadius: '8px'
  },
  policyIcon: {
    fontSize: '2em',
    marginBottom: '10px'
  },
  policyTitle: {
    marginBottom: '8px',
    color: '#0F1111'
  },
  policyText: {
    color: '#565959',
    fontSize: '0.9em'
  }
};

export default SellerReturnsPage;
