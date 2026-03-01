import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerDisputesPage = () => {
  const [activeDisputes, setActiveDisputes] = useState([]);
  const [resolvedDisputes, setResolvedDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getDisputes();
      
      const active = response.disputes?.filter(d => d.status !== 'Resolved') || [];
      const resolved = response.disputes?.filter(d => d.status === 'Resolved') || [];
      
      setActiveDisputes(active);
      setResolvedDisputes(resolved);
    } catch (err) {
      setError(err.message || 'Failed to load disputes');
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (disputeId) => {
    toast.info(`Viewing dispute ${disputeId}`);
  };

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
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load disputes</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchDisputes} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dispute Management</h1>
      <p style={styles.subtitle}>Manage customer disputes and resolution cases</p>

      {/* Active Disputes */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Active Disputes</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Dispute ID</th>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeDisputes.length > 0 ? (
                activeDisputes.map((dispute) => (
                  <tr key={dispute.id}>
                    <td style={styles.td}>{dispute.disputeId}</td>
                    <td style={styles.td}>{dispute.orderId}</td>
                    <td style={styles.td}>{dispute.customer}</td>
                    <td style={styles.td}>{dispute.reason}</td>
                    <td style={styles.td}>${dispute.amount}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(dispute.status === 'Open' ? styles.badgeOpen :
                            dispute.status === 'Under Review' ? styles.badgePending :
                            styles.badgeResolved)
                      }}>
                        {dispute.status}
                      </span>
                    </td>
                    <td style={styles.td}>{dispute.date}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleViewDetails(dispute.disputeId)}
                        style={styles.btnSm}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No active disputes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolved Disputes */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Resolved Disputes</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Dispute ID</th>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Resolution</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Resolved Date</th>
              </tr>
            </thead>
            <tbody>
              {resolvedDisputes.length > 0 ? (
                resolvedDisputes.map((dispute) => (
                  <tr key={dispute.id}>
                    <td style={styles.td}>{dispute.disputeId}</td>
                    <td style={styles.td}>{dispute.orderId}</td>
                    <td style={styles.td}>{dispute.customer}</td>
                    <td style={styles.td}>{dispute.resolution}</td>
                    <td style={styles.td}>${dispute.amount}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...styles.badgeResolved }}>
                        {dispute.status}
                      </span>
                    </td>
                    <td style={styles.td}>{dispute.resolvedDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No resolved disputes
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
    fontSize: '2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px'
  },
  section: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    marginBottom: '20px',
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
    padding: '12px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#0F1111'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #D5D9D9',
    color: '#0F1111'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.85em',
    fontWeight: 'bold'
  },
  badgeOpen: {
    background: '#FFE5E5',
    color: '#C7511F'
  },
  badgePending: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgeResolved: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  btnSm: {
    padding: '6px 12px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#0F1111'
  }
};

export default SellerDisputesPage;
