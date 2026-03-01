import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const AdminCommissionsPage = () => {
  const [commissions, setCommissions] = useState({
    bronze: 15,
    silver: 12,
    gold: 10,
    platinum: 8
  });
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getCommissions();
      if (data) {
        setCommissions(data.rates || commissions);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching commission data:', error);
      const errorMessage = error.message || 'Failed to load commission data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      await adminAPI.updateCommissions(commissions);
      toast.success('Commission rates updated successfully');
      fetchCommissionData();
    } catch (error) {
      const errorMessage = error.message || 'Failed to update commissions';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const calculateTotalCommission = () => {
    return history.reduce((sum, item) => sum + item.commission, 0);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={styles.spinner}>Loading commission data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💰 Commission Settings</h1>
      <p style={styles.subtitle}>
        Configure commission rates for different seller tiers
      </p>

      {error && (
        <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Commission (This Month)</div>
          <div style={styles.statValue}>${calculateTotalCommission().toLocaleString()}</div>
          <div style={styles.statChange}>↑ 15.8% from last month</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active Sellers</div>
          <div style={styles.statValue}>1,234</div>
          <div style={styles.statChange}>Across all tiers</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Average Commission Rate</div>
          <div style={styles.statValue}>11.25%</div>
          <div style={styles.statChange}>Weighted average</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Commission Revenue</div>
          <div style={styles.statValue}>$124,589</div>
          <div style={styles.statChange}>↑ 18.2% from last month</div>
        </div>
      </div>

      {/* Commission Rates Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Seller Tier Commission Rates</h2>

        <div style={styles.tiersGrid}>
          <div style={styles.tierCard}>
            <div style={styles.tierHeader}>
              <div style={styles.tierIcon}>🥉</div>
              <div style={styles.tierName}>Bronze Tier</div>
            </div>
            <div style={styles.tierInfo}>Entry level sellers</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Commission Rate (%)</label>
              <input
                type="number"
                value={commissions.bronze}
                step="0.1"
                onChange={(e) => setCommissions({ ...commissions, bronze: parseFloat(e.target.value) })}
                style={styles.input}
              />
            </div>
            <div style={styles.tierStats}>
              <div>
                <div style={styles.tierStatValue}>456</div>
                <div style={styles.tierStatLabel}>Sellers</div>
              </div>
              <div>
                <div style={styles.tierStatValue}>$45K</div>
                <div style={styles.tierStatLabel}>Commission</div>
              </div>
            </div>
          </div>

          <div style={styles.tierCard}>
            <div style={styles.tierHeader}>
              <div style={styles.tierIcon}>🥈</div>
              <div style={styles.tierName}>Silver Tier</div>
            </div>
            <div style={styles.tierInfo}>Established sellers</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Commission Rate (%)</label>
              <input
                type="number"
                value={commissions.silver}
                step="0.1"
                onChange={(e) => setCommissions({ ...commissions, silver: parseFloat(e.target.value) })}
                style={styles.input}
              />
            </div>
            <div style={styles.tierStats}>
              <div>
                <div style={styles.tierStatValue}>523</div>
                <div style={styles.tierStatLabel}>Sellers</div>
              </div>
              <div>
                <div style={styles.tierStatValue}>$38K</div>
                <div style={styles.tierStatLabel}>Commission</div>
              </div>
            </div>
          </div>

          <div style={styles.tierCard}>
            <div style={styles.tierHeader}>
              <div style={styles.tierIcon}>🥇</div>
              <div style={styles.tierName}>Gold Tier</div>
            </div>
            <div style={styles.tierInfo}>Premium sellers</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Commission Rate (%)</label>
              <input
                type="number"
                value={commissions.gold}
                step="0.1"
                onChange={(e) => setCommissions({ ...commissions, gold: parseFloat(e.target.value) })}
                style={styles.input}
              />
            </div>
            <div style={styles.tierStats}>
              <div>
                <div style={styles.tierStatValue}>189</div>
                <div style={styles.tierStatLabel}>Sellers</div>
              </div>
              <div>
                <div style={styles.tierStatValue}>$28K</div>
                <div style={styles.tierStatLabel}>Commission</div>
              </div>
            </div>
          </div>

          <div style={styles.tierCard}>
            <div style={styles.tierHeader}>
              <div style={styles.tierIcon}>💎</div>
              <div style={styles.tierName}>Platinum Tier</div>
            </div>
            <div style={styles.tierInfo}>Elite sellers</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Commission Rate (%)</label>
              <input
                type="number"
                value={commissions.platinum}
                step="0.1"
                onChange={(e) => setCommissions({ ...commissions, platinum: parseFloat(e.target.value) })}
                style={styles.input}
              />
            </div>
            <div style={styles.tierStats}>
              <div>
                <div style={styles.tierStatValue}>66</div>
                <div style={styles.tierStatLabel}>Sellers</div>
              </div>
              <div>
                <div style={styles.tierStatValue}>$13K</div>
                <div style={styles.tierStatLabel}>Commission</div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} style={styles.primaryButton}>
          Save Changes
        </button>
      </div>

      {/* Commission History */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Commission Transactions</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Seller</th>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>Order Value</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Commission</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td style={styles.td}>{item.date}</td>
                  <td style={styles.td}>{item.seller}</td>
                  <td style={styles.td}>
                    <span style={styles.tierBadge}>{item.tier}</span>
                  </td>
                  <td style={styles.td}>${item.orderValue.toLocaleString()}</td>
                  <td style={styles.td}>{item.rate}%</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#FF9900' }}>
                    ${item.commission.toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: item.status === 'Paid' ? '#D4EDDA' : '#FFF3CD',
                      color: item.status === 'Paid' ? '#155724' : '#856404'
                    }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9'
  },
  statLabel: {
    fontSize: '0.9em',
    color: '#565959',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '2em',
    fontWeight: 'bold',
    color: '#FF9900'
  },
  statChange: {
    fontSize: '0.9em',
    color: '#067D62',
    marginTop: '8px'
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
  tiersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  tierCard: {
    padding: '20px',
    border: '2px solid #D5D9D9',
    borderRadius: '12px',
    background: '#FFFFFF'
  },
  tierHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  tierIcon: {
    fontSize: '2em'
  },
  tierName: {
    fontSize: '1.3em',
    fontWeight: 'bold',
    color: '#0F1111'
  },
  tierInfo: {
    fontSize: '0.9em',
    color: '#565959',
    marginBottom: '15px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: '8px',
    fontSize: '0.9em',
    color: '#0F1111'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '1em'
  },
  tierStats: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '15px',
    background: '#F7F8F8',
    borderRadius: '8px'
  },
  tierStatValue: {
    fontSize: '1.3em',
    fontWeight: 'bold',
    color: '#FF9900',
    textAlign: 'center'
  },
  tierStatLabel: {
    fontSize: '0.85em',
    color: '#565959',
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
  tierBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.9em',
    background: '#F7F8F8'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '0.85em',
    fontWeight: 600
  }
};

export default AdminCommissionsPage;
