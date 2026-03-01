import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    orders: 0,
    avgOrderValue: 0,
    conversionRate: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last-3-months');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [revenueData, salesData] = await Promise.all([
        sellerAPI.getRevenueAnalytics({ period: dateRange }),
        sellerAPI.getSalesAnalytics({ period: dateRange })
      ]);
      
      setAnalytics({
        revenue: revenueData.totalRevenue || 0,
        orders: salesData.totalOrders || 0,
        avgOrderValue: revenueData.avgOrderValue || 0,
        conversionRate: salesData.conversionRate || 0
      });
      
      setTopProducts(salesData.topProducts || []);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
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
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load analytics</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchAnalytics} style={styles.primaryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Sales Analytics</h1>
      <p style={styles.subtitle}>Track your store performance and sales trends</p>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={styles.select}
          >
            <option value="last-7-days">Last 7 Days</option>
            <option value="last-30-days">Last 30 Days</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="last-year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Category</label>
          <select style={styles.select}>
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Accessories</option>
            <option>Wearables</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>&nbsp;</label>
          <button onClick={() => toast.success('Filters applied')} style={styles.primaryButton}>
            Apply Filters
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Revenue</div>
          <div style={styles.statValue}>${analytics.revenue.toLocaleString()}</div>
          <div style={styles.statChange}>↑ 23.5% vs previous period</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Orders</div>
          <div style={styles.statValue}>{analytics.orders.toLocaleString()}</div>
          <div style={styles.statChange}>↑ 18.2% vs previous period</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Average Order Value</div>
          <div style={styles.statValue}>${analytics.avgOrderValue.toFixed(2)}</div>
          <div style={styles.statChange}>↑ 4.3% vs previous period</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Conversion Rate</div>
          <div style={styles.statValue}>{analytics.conversionRate}%</div>
          <div style={{...styles.statChange, color: '#C7511F'}}>↓ 0.5% vs previous period</div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Revenue Trend</h2>
        <div style={styles.chartPlaceholder}>📊 Revenue Chart (Line Graph)</div>
      </div>

      {/* Top Selling Products */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Top Selling Products</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Units Sold</th>
                <th style={styles.th}>Revenue</th>
                <th style={styles.th}>Avg. Price</th>
                <th style={styles.th}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={product.id || index}>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{product.unitsSold}</td>
                    <td style={{...styles.td, fontWeight: 600}}>${product.revenue?.toLocaleString() || '0'}</td>
                    <td style={styles.td}>${product.avgPrice}</td>
                    <td style={styles.td}>
                      <div style={styles.progressBar}>
                        <div style={{...styles.progressFill, width: `${100 - (index * 15)}%`}}></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No product data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales by Category */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Sales by Category</h2>
        <div style={styles.chartPlaceholder}>🥧 Category Distribution (Pie Chart)</div>
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
  filterBar: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end',
    flexWrap: 'wrap'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    minWidth: '200px'
  },
  filterLabel: {
    fontSize: '0.85em',
    color: '#565959',
    fontWeight: 600
  },
  select: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '0.95em',
    background: '#FFFFFF'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95em'
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
  chartPlaceholder: {
    height: '300px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '1.2em'
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
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#F7F8F8',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#FF9900',
    transition: 'width 0.3s'
  }
};

export default SellerAnalyticsPage;
