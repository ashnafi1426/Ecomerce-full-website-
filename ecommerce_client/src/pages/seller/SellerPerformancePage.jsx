import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerPerformancePage = () => {
  const [metrics, setMetrics] = useState({
    fulfillmentRate: 0,
    onTimeShipment: 0,
    customerRating: 0,
    returnRate: 0,
    responseTime: 0,
    policyCompliance: 0
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getPerformanceMetrics();
      
      setMetrics({
        fulfillmentRate: response.fulfillmentRate || 0,
        onTimeShipment: response.onTimeShipment || 0,
        customerRating: response.customerRating || 0,
        returnRate: response.returnRate || 0,
        responseTime: response.responseTime || 0,
        policyCompliance: response.policyCompliance || 0
      });
      
      setHistory(response.history || []);
    } catch (err) {
      setError(err.message || 'Failed to load performance data');
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (value, target, isLower = false) => {
    if (isLower) {
      return value <= target ? '#067D62' : '#C7511F';
    }
    return value >= target ? '#067D62' : value >= target * 0.8 ? '#F08804' : '#C7511F';
  };

  const getStatusLabel = (fulfillment, onTime, rating) => {
    if (fulfillment >= 95 && onTime >= 90 && rating >= 4.5) return 'Excellent';
    if (fulfillment >= 90 && onTime >= 85 && rating >= 4.0) return 'Good';
    return 'Fair';
  };

  const getStatusColor = (status) => {
    if (status === 'Excellent') return '#067D62';
    if (status === 'Good') return '#067D62';
    return '#F08804';
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
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load performance data</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchPerformanceData} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Performance Metrics</h1>
      <p style={styles.subtitle}>Monitor your seller performance and meet platform standards</p>

      {/* Performance Grid */}
      <div style={styles.performanceGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={styles.metricTitle}>Order Fulfillment Rate</div>
            <div style={styles.metricIcon}>📦</div>
          </div>
          <div style={styles.metricValue}>{metrics.fulfillmentRate}%</div>
          <div style={styles.metricTarget}>Target: &gt;95%</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${metrics.fulfillmentRate}%`,
                background: getProgressColor(metrics.fulfillmentRate, 95)
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={styles.metricTitle}>On-Time Shipment</div>
            <div style={styles.metricIcon}>🚚</div>
          </div>
          <div style={styles.metricValue}>{metrics.onTimeShipment}%</div>
          <div style={styles.metricTarget}>Target: &gt;90%</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${metrics.onTimeShipment}%`,
                background: getProgressColor(metrics.onTimeShipment, 90)
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={styles.metricTitle}>Customer Rating</div>
            <div style={styles.metricIcon}>⭐</div>
          </div>
          <div style={styles.metricValue}>{metrics.customerRating}/5.0</div>
          <div style={styles.metricTarget}>Target: &gt;4.0</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${(metrics.customerRating / 5) * 100}%`,
                background: getProgressColor(metrics.customerRating, 4)
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={styles.metricTitle}>Return Rate</div>
            <div style={styles.metricIcon}>↩️</div>
          </div>
          <div style={styles.metricValue}>{metrics.returnRate}%</div>
          <div style={styles.metricTarget}>Target: &lt;10%</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${100 - (metrics.returnRate * 10)}%`,
                background: getProgressColor(metrics.returnRate, 10, true)
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={styles.metricTitle}>Response Time</div>
            <div style={styles.metricIcon}>⏱️</div>
          </div>
          <div style={styles.metricValue}>{metrics.responseTime} hrs</div>
          <div style={styles.metricTarget}>Target: &lt;24 hrs</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${100 - (metrics.responseTime / 24 * 100)}%`,
                background: getProgressColor(metrics.responseTime, 24, true)
              }}
            />
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <div style={styles.metricTitle}>Policy Compliance</div>
            <div style={styles.metricIcon}>✅</div>
          </div>
          <div style={styles.metricValue}>{metrics.policyCompliance}%</div>
          <div style={styles.metricTarget}>Target: 100%</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${metrics.policyCompliance}%`,
                background: getProgressColor(metrics.policyCompliance, 100)
              }}
            />
          </div>
        </div>
      </div>

      {/* Performance History */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Performance History</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Month</th>
                <th style={styles.th}>Fulfillment</th>
                <th style={styles.th}>On-Time Ship</th>
                <th style={styles.th}>Rating</th>
                <th style={styles.th}>Return Rate</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((record, index) => {
                  const status = getStatusLabel(record.fulfillment, record.onTimeShip, record.rating);
                  return (
                    <tr key={index}>
                      <td style={styles.td}>{record.month}</td>
                      <td style={styles.td}>{record.fulfillment}%</td>
                      <td style={styles.td}>{record.onTimeShip}%</td>
                      <td style={styles.td}>{record.rating}</td>
                      <td style={styles.td}>{record.returnRate}%</td>
                      <td style={{
                        ...styles.td,
                        color: getStatusColor(status),
                        fontWeight: 'bold'
                      }}>
                        {status}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No performance history available
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
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  metricCard: {
    background: '#FFFFFF',
    padding: '25px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9'
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  metricTitle: {
    fontSize: '1.1em',
    fontWeight: 600,
    color: '#0F1111'
  },
  metricIcon: {
    fontSize: '2em'
  },
  metricValue: {
    fontSize: '2.5em',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#0F1111'
  },
  metricTarget: {
    fontSize: '0.9em',
    color: '#565959'
  },
  progressBar: {
    width: '100%',
    height: '10px',
    background: '#F7F8F8',
    borderRadius: '5px',
    overflow: 'hidden',
    marginTop: '10px'
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s'
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
  }
};

export default SellerPerformancePage;
