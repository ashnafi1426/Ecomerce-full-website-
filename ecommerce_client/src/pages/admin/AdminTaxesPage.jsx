import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-hot-toast';

const AdminTaxesPage = () => {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxDisplayMode, setTaxDisplayMode] = useState('excluding');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const fetchTaxRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getTaxes();
      if (data) {
        setTaxRates(data.rates || []);
        setTaxEnabled(data.enabled !== undefined ? data.enabled : true);
        setTaxDisplayMode(data.displayMode || 'excluding');
      }
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      const errorMessage = error.message || 'Failed to load tax rates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setError(null);
      await adminAPI.updateSettings({ taxEnabled, taxDisplayMode });
      toast.success('Tax settings saved successfully');
    } catch (error) {
      const errorMessage = error.message || 'Failed to save settings';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax rate?')) {
      try {
        setError(null);
        await adminAPI.deleteTaxRate(id);
        toast.success('Tax rate deleted');
        fetchTaxRates();
      } catch (error) {
        const errorMessage = error.message || 'Failed to delete tax rate';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const calculateTotalTax = () => {
    return taxRates.reduce((sum, rate) => sum + parseFloat(rate.rate), 0) / taxRates.length;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={styles.spinner}>Loading tax configuration...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💵 Tax Configuration</h1>
      <p style={styles.subtitle}>
        Manage tax rates and settings for different regions
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
          <div style={styles.statLabel}>Total Tax Regions</div>
          <div style={styles.statValue}>{taxRates.length}</div>
          <div style={styles.statChange}>Active tax configurations</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Average Tax Rate</div>
          <div style={styles.statValue}>{calculateTotalTax().toFixed(2)}%</div>
          <div style={styles.statChange}>Across all regions</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Tax Collection (This Month)</div>
          <div style={styles.statValue}>$89,234</div>
          <div style={styles.statChange}>↑ 12.3% from last month</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Tax Status</div>
          <div style={styles.statValue}>{taxEnabled ? 'Enabled' : 'Disabled'}</div>
          <div style={styles.statChange}>System-wide setting</div>
        </div>
      </div>

      {/* General Settings */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>General Tax Settings</h2>
        
        <div style={styles.settingsGrid}>
          <div style={styles.settingCard}>
            <label style={styles.settingLabel}>
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                style={styles.checkbox}
              />
              Enable Tax Calculation
            </label>
            <div style={styles.settingDescription}>
              Calculate and apply taxes on all orders based on customer location
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tax Display Mode</label>
            <select
              value={taxDisplayMode}
              onChange={(e) => setTaxDisplayMode(e.target.value)}
              style={styles.select}
            >
              <option value="including">Including Tax</option>
              <option value="excluding">Excluding Tax</option>
              <option value="both">Both (Including & Excluding)</option>
            </select>
            <div style={styles.settingDescription}>
              How prices are displayed to customers
            </div>
          </div>
        </div>

        <button onClick={handleSaveSettings} style={styles.primaryButton}>
          Save Settings
        </button>
      </div>

      {/* Tax Rates Table */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Tax Rates by Region</h2>
          <button
            onClick={() => toast.success('Add Tax Rate feature coming soon')}
            style={styles.primaryButton}
          >
            + Add Tax Rate
          </button>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Country/State</th>
                <th style={styles.th}>Tax Rate</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxRates.map((rate) => (
                <tr key={rate.id}>
                  <td style={styles.td}>{rate.region}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#FF9900' }}>
                    {rate.rate}%
                  </td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{rate.type}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: rate.status === 'Active' ? '#D4EDDA' : '#F8D7DA',
                      color: rate.status === 'Active' ? '#155724' : '#721C24'
                    }}>
                      {rate.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => toast.success(`Edit ${rate.region}`)}
                      style={styles.secondaryButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      style={{ ...styles.secondaryButton, marginLeft: '5px' }}
                    >
                      Delete
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '1.4em',
    fontWeight: 600,
    color: '#0F1111',
    marginBottom: '20px'
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  settingCard: {
    padding: '20px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    background: '#F7F8F8'
  },
  settingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 600,
    fontSize: '1em',
    color: '#0F1111',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  settingDescription: {
    fontSize: '0.85em',
    color: '#565959',
    marginTop: '8px'
  },
  formGroup: {
    padding: '20px',
    border: '1px solid #D5D9D9',
    borderRadius: '8px',
    background: '#F7F8F8'
  },
  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: '8px',
    fontSize: '1em',
    color: '#0F1111'
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #D5D9D9',
    borderRadius: '4px',
    fontSize: '1em',
    background: '#FFFFFF'
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
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '0.85em',
    background: '#E3F2FD',
    color: '#1565C0',
    fontWeight: 600
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '0.85em',
    fontWeight: 600
  },
  secondaryButton: {
    padding: '6px 14px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
    color: '#0F1111'
  }
};

export default AdminTaxesPage;
