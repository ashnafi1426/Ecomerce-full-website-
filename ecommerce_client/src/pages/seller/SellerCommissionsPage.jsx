import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerCommissionsPage = () => {
  const [currentTier, setCurrentTier] = useState({
    name: '',
    rate: 0,
    monthlySales: 0,
    nextTierThreshold: 0
  });
  const [tiers, setTiers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCommissionData();
  }, []);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getCommissions();
      const data = response.data || response;
      
      setCurrentTier(data.currentTier || {});
      setTiers(data.tiers || []);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching commission data:', err);
      setError(err.message || 'Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const getTierBadgeStyle = (tierName) => {
    switch (tierName.toLowerCase()) {
      case 'bronze':
        return styles.badgeBronze;
      case 'silver':
        return styles.badgeSilver;
      case 'gold':
        return styles.badgeGold;
      case 'platinum':
        return styles.badgePlatinum;
      default:
        return styles.badge;
    }
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load commission data</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchCommissionData} style={styles.retryButton}>
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
      <h1 style={styles.title}>Commission Details</h1>
      <p style={styles.subtitle}>Understand your commission structure and tier benefits</p>

      {/* Current Tier Card */}
      <div style={styles.infoCard}>
        <h2 style={styles.infoCardTitle}>Your Current Tier: {currentTier.name}</h2>
        <div style={styles.commissionRate}>{currentTier.rate}%</div>
        <p style={styles.infoCardText}>Commission Rate on all sales</p>
        <p style={styles.infoCardSubtext}>
          Monthly Sales: ${currentTier.monthlySales.toLocaleString()} | Next Tier at ${currentTier.nextTierThreshold.toLocaleString()}/month
        </p>
      </div>

      {/* Commission Tiers */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Commission Tiers</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Tier</th>
                <th style={styles.th}>Monthly Sales</th>
                <th style={styles.th}>Commission Rate</th>
                <th style={styles.th}>Benefits</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, index) => (
                <tr key={index}>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...getTierBadgeStyle(tier.name) }}>
                      {tier.name}
                    </span>
                  </td>
                  <td style={styles.td}>{tier.salesRange}</td>
                  <td style={styles.td}>{tier.rate}%</td>
                  <td style={styles.td}>{tier.benefits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission History */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Commission History</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Period</th>
                <th style={styles.th}>Gross Sales</th>
                <th style={styles.th}>Commission Rate</th>
                <th style={styles.th}>Commission Paid</th>
                <th style={styles.th}>Net Earnings</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, index) => (
                <tr key={index}>
                  <td style={styles.td}>{record.period}</td>
                  <td style={styles.td}>${record.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={styles.td}>{record.rate}%</td>
                  <td style={styles.td}>${record.commissionPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={styles.td}>${record.netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
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
  infoCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#FFFFFF',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  infoCardTitle: {
    fontSize: '1.5em',
    marginBottom: '15px'
  },
  commissionRate: {
    fontSize: '3em',
    fontWeight: 'bold',
    margin: '20px 0'
  },
  infoCardText: {
    fontSize: '1em',
    marginBottom: '10px'
  },
  infoCardSubtext: {
    fontSize: '1em',
    marginTop: '15px'
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
  badgeBronze: {
    background: '#CD7F32',
    color: '#FFFFFF'
  },
  badgeSilver: {
    background: '#C0C0C0',
    color: '#0F1111'
  },
  badgeGold: {
    background: '#FFD700',
    color: '#0F1111'
  },
  badgePlatinum: {
    background: '#E5E4E2',
    color: '#0F1111'
  }
};

export default SellerCommissionsPage;
