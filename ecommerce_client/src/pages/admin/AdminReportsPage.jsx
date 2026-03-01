import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [error, setError] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      // Note: This endpoint may need to be added to api.service.js
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setRecentReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      const errorMessage = error.message || 'Failed to load reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (reportType) => {
    try {
      setError(null);
      toast.loading(`Generating ${reportType}...`);
      await adminAPI.generateReport(reportType, { period: selectedPeriod });
      toast.dismiss();
      toast.success('Report generated successfully!');
      fetchReports();
    } catch (error) {
      toast.dismiss();
      const errorMessage = error.message || 'Failed to generate report';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={styles.spinner}>Loading reports...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📊 Reports & Insights</h1>
      <p style={styles.subtitle}>
        Generate and download comprehensive business reports
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
          <div style={styles.statLabel}>Reports Generated</div>
          <div style={styles.statValue}>234</div>
          <div style={styles.statChange}>This month</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Last Report</div>
          <div style={styles.statValue}>2 hrs ago</div>
          <div style={styles.statChange}>Revenue Report</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Scheduled Reports</div>
          <div style={styles.statValue}>12</div>
          <div style={styles.statChange}>Auto-generated weekly</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Export Formats</div>
          <div style={styles.statValue}>3</div>
          <div style={styles.statChange}>PDF, Excel, CSV</div>
        </div>
      </div>

      {/* Report Period Filter */}
      <div style={styles.filterSection}>
        <label style={styles.filterLabel}>Report Period:</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          style={styles.select}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* Available Reports */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Available Reports</h2>
        <div style={styles.reportsGrid}>
          {reports.map((report, index) => (
            <div key={index} style={styles.reportCard}>
              <div style={styles.reportIcon}>{report.icon}</div>
              <div style={styles.reportTitle}>{report.title}</div>
              <div style={styles.reportDesc}>{report.desc}</div>
              <div style={styles.reportMeta}>
                <span style={styles.reportCategory}>{report.category}</span>
                <span style={styles.reportTime}>{report.time}</span>
              </div>
              <div style={styles.reportActions}>
                <button
                  onClick={() => handleGenerate(report.title)}
                  style={styles.primaryButton}
                >
                  Generate
                </button>
                <button
                  onClick={() => toast.success('View report history')}
                  style={styles.secondaryButton}
                >
                  History
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Export Options</h2>
        <div style={styles.exportGrid}>
          <div style={styles.exportCard} onClick={() => handleExport('pdf')}>
            <div style={styles.exportIcon}>📄</div>
            <div style={styles.exportTitle}>PDF Export</div>
            <div style={styles.exportDesc}>Professional formatted reports</div>
          </div>
          <div style={styles.exportCard} onClick={() => handleExport('excel')}>
            <div style={styles.exportIcon}>📊</div>
            <div style={styles.exportTitle}>Excel Export</div>
            <div style={styles.exportDesc}>Editable spreadsheet format</div>
          </div>
          <div style={styles.exportCard} onClick={() => handleExport('csv')}>
            <div style={styles.exportIcon}>📋</div>
            <div style={styles.exportTitle}>CSV Export</div>
            <div style={styles.exportDesc}>Raw data for analysis</div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Reports</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Report Name</th>
                <th style={styles.th}>Generated</th>
                <th style={styles.th}>Period</th>
                <th style={styles.th}>Format</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report) => (
                <tr key={report.id}>
                  <td style={styles.td}>{report.name}</td>
                  <td style={styles.td}>{report.generated}</td>
                  <td style={styles.td}>{report.period}</td>
                  <td style={styles.td}>
                    <span style={styles.formatBadge}>{report.format}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: report.status === 'Ready' ? '#D4EDDA' : '#FFF3CD',
                      color: report.status === 'Ready' ? '#155724' : '#856404'
                    }}>
                      {report.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => toast.success('Downloading report...')}
                      style={styles.actionButton}
                    >
                      Download
                    </button>
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

const reports = [
  {
    icon: '💰',
    title: 'Revenue Report',
    desc: 'Detailed revenue breakdown by category, seller, and time period',
    category: 'Financial',
    time: '~2 min'
  },
  {
    icon: '👥',
    title: 'User Activity Report',
    desc: 'User engagement, registration trends, and activity metrics',
    category: 'Analytics',
    time: '~3 min'
  },
  {
    icon: '📦',
    title: 'Product Performance',
    desc: 'Best sellers, inventory levels, and product analytics',
    category: 'Products',
    time: '~2 min'
  },
  {
    icon: '🛍️',
    title: 'Order Analytics',
    desc: 'Order volume, fulfillment rates, and delivery performance',
    category: 'Operations',
    time: '~2 min'
  },
  {
    icon: '🏪',
    title: 'Seller Performance',
    desc: 'Seller rankings, commission data, and performance metrics',
    category: 'Sellers',
    time: '~3 min'
  },
  {
    icon: '📊',
    title: 'Financial Summary',
    desc: 'Complete financial overview including payments and payouts',
    category: 'Financial',
    time: '~4 min'
  },
  {
    icon: '📈',
    title: 'Growth Analytics',
    desc: 'Platform growth trends, user acquisition, and retention',
    category: 'Analytics',
    time: '~3 min'
  },
  {
    icon: '💳',
    title: 'Payment Report',
    desc: 'Payment methods, transaction success rates, and refunds',
    category: 'Financial',
    time: '~2 min'
  }
];

const recentReports = [];

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
  filterSection: {
    background: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #D5D9D9',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  filterLabel: {
    fontWeight: 600,
    color: '#0F1111'
  },
  select: {
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '1em',
    background: '#FFFFFF',
    minWidth: '200px'
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
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  reportCard: {
    padding: '20px',
    border: '2px solid #D5D9D9',
    borderRadius: '12px',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  reportIcon: {
    fontSize: '2.5em',
    marginBottom: '10px'
  },
  reportTitle: {
    fontSize: '1.2em',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#0F1111'
  },
  reportDesc: {
    color: '#565959',
    fontSize: '0.9em',
    marginBottom: '12px',
    lineHeight: '1.5'
  },
  reportMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  reportCategory: {
    fontSize: '0.85em',
    padding: '4px 10px',
    background: '#E3F2FD',
    color: '#1565C0',
    borderRadius: '4px',
    fontWeight: 600
  },
  reportTime: {
    fontSize: '0.85em',
    color: '#565959'
  },
  reportActions: {
    display: 'flex',
    gap: '10px'
  },
  primaryButton: {
    background: '#FF9900',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9em',
    flex: 1
  },
  secondaryButton: {
    padding: '10px 20px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    flex: 1,
    color: '#0F1111'
  },
  exportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  exportCard: {
    padding: '25px',
    border: '2px solid #D5D9D9',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  exportIcon: {
    fontSize: '3em',
    marginBottom: '10px'
  },
  exportTitle: {
    fontSize: '1.1em',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#0F1111'
  },
  exportDesc: {
    fontSize: '0.85em',
    color: '#565959'
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
  formatBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.85em',
    background: '#FFF3CD',
    color: '#856404',
    fontWeight: 600
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '0.85em',
    fontWeight: 600
  },
  actionButton: {
    padding: '6px 14px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    color: '#0F1111'
  }
};

export default AdminReportsPage;
