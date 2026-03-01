import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await sellerAPI.getInvoices();
      setInvoices(response.data?.invoices || response.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      await sellerAPI.downloadInvoice(invoiceId);
      toast.success(`Downloading invoice ${invoiceId}...`);
    } catch (err) {
      console.error('Error downloading invoice:', err);
    }
  };

  const handleViewInvoice = (invoiceId) => {
    toast.info(`Viewing invoice ${invoiceId}`);
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load invoices</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchInvoices} style={styles.retryButton}>
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
      <h1 style={styles.title}>Invoices</h1>
      <p style={styles.subtitle}>Download and manage your sales invoices</p>

      {/* Recent Invoices */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Invoices</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Invoice #</th>
                <th style={styles.th}>Period</th>
                <th style={styles.th}>Issue Date</th>
                <th style={styles.th}>Total Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id || invoice._id}>
                    <td style={styles.td}>{invoice.invoiceNumber || invoice.number}</td>
                    <td style={styles.td}>{invoice.period}</td>
                    <td style={styles.td}>{invoice.issueDate || new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>${(invoice.totalAmount || invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(invoice.status === 'Paid' || invoice.status === 'paid' ? styles.badgePaid : styles.badgePending)
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <button
                          onClick={() => handleDownloadPDF(invoice.invoiceNumber || invoice.id)}
                          style={styles.btnSm}
                        >
                          📥 Download PDF
                        </button>
                        <button
                          onClick={() => handleViewInvoice(invoice.invoiceNumber || invoice.id)}
                          style={styles.btnSm}
                        >
                          👁️ View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No invoices found
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
  badgePaid: {
    background: '#E6F4F1',
    color: '#067D62',
    fontWeight: 'bold'
  },
  badgePending: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  actionBtns: {
    display: 'flex',
    gap: '8px'
  },
  btnSm: {
    padding: '6px 12px',
    border: '1px solid #D5D9D9',
    background: '#FFFFFF',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85em',
    textDecoration: 'none',
    color: '#0F1111'
  }
};

export default SellerInvoicesPage;
