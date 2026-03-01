import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { sellerAPI } from '../../services/api.service';

const SellerPayoutsPage = () => {
  const [balance, setBalance] = useState({
    available: 0,
    pending: 0,
    nextPayoutDate: '',
    nextPayoutAmount: 0
  });
  const [payouts, setPayouts] = useState([]);
  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [balanceData, payoutsData, profileData] = await Promise.all([
        sellerAPI.getBalance(),
        sellerAPI.getPayouts(),
        sellerAPI.getProfile()
      ]);
      
      setBalance(balanceData.data || balanceData);
      setPayouts(payoutsData.data?.payouts || payoutsData.payouts || []);
      setBankAccount(profileData.data?.bankAccount || profileData.bankAccount || {});
    } catch (err) {
      console.error('Error fetching payout data:', err);
      setError(err.message || 'Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (balance.available === 0) {
      toast.error('No available balance to withdraw');
      return;
    }
    
    try {
      await sellerAPI.requestWithdrawal(balance.available);
      toast.success('Withdrawal request submitted');
      fetchPayoutData();
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
    }
  };

  const handleDownloadStatement = () => {
    toast.success('Downloading payout statement...');
  };

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={{ fontSize: '3em' }}>⚠️</span>
        <h2 style={{ color: '#0F1111', marginTop: '20px' }}>Failed to load payout data</h2>
        <p style={{ color: '#565959', marginBottom: '20px' }}>{error}</p>
        <button onClick={fetchPayoutData} style={styles.retryButton}>
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
      <h1 style={styles.title}>Payouts</h1>
      <p style={styles.subtitle}>Manage your earnings and payout schedule</p>

      {/* Balance Card */}
      <div style={styles.balanceCard}>
        <div style={styles.balanceLabel}>Available Balance</div>
        <div style={styles.balanceAmount}>${balance.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div style={styles.balanceInfo}>
          <div style={styles.nextPayout}>
            <div style={styles.nextPayoutLabel}>Next Payout</div>
            <div style={styles.nextPayoutDate}>{balance.nextPayoutDate}</div>
            <div style={styles.nextPayoutAmount}>${balance.nextPayoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={styles.nextPayout}>
            <div style={styles.nextPayoutLabel}>Pending Balance</div>
            <div style={styles.nextPayoutAmount}>${balance.pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          </div>
          <button onClick={handleWithdraw} style={styles.withdrawButton}>
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Bank Account Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Bank Account</h2>
          <button onClick={() => toast.info('Edit bank account')} style={styles.secondaryButton}>
            Edit Account
          </button>
        </div>
        <div style={styles.bankInfo}>
          <div style={styles.bankDetail}>
            <div style={styles.bankLabel}>Bank Name</div>
            <div style={styles.bankValue}>{bankAccount.bankName}</div>
          </div>
          <div style={styles.bankDetail}>
            <div style={styles.bankLabel}>Account Number</div>
            <div style={styles.bankValue}>{bankAccount.accountNumber}</div>
          </div>
          <div style={styles.bankDetail}>
            <div style={styles.bankLabel}>Account Holder</div>
            <div style={styles.bankValue}>{bankAccount.accountHolder}</div>
          </div>
        </div>
      </div>

      {/* Payout History */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Payout History</h2>
          <button onClick={handleDownloadStatement} style={styles.secondaryButton}>
            Download Statement
          </button>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Payout ID</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Bank Account</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length > 0 ? (
                payouts.map((payout) => (
                  <tr key={payout.id || payout._id}>
                    <td style={styles.td}>{payout.payoutId || payout.id}</td>
                    <td style={styles.td}>{payout.date || new Date(payout.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>${(payout.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        ...(payout.status === 'Completed' || payout.status === 'completed' ? styles.badgeCompleted :
                            payout.status === 'Processing' || payout.status === 'processing' ? styles.badgeProcessing :
                            styles.badgePending)
                      }}>
                        {payout.status}
                      </span>
                    </td>
                    <td style={styles.td}>{payout.bankAccount || '****' + (payout.accountLast4 || '0000')}</td>
                    <td style={styles.td}>
                      <div style={styles.actionBtns}>
                        <button onClick={() => toast.info('View details')} style={styles.btnSm}>
                          View
                        </button>
                        <button onClick={() => toast.success('Downloading receipt...')} style={styles.btnSm}>
                          Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#565959' }}>
                    No payout history found
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
    fontSize: '2.2em',
    marginBottom: '10px',
    color: '#0F1111'
  },
  subtitle: {
    color: '#565959',
    marginBottom: '30px',
    fontSize: '1.05em'
  },
  balanceCard: {
    background: 'linear-gradient(135deg, #FF9900 0%, #F08804 100%)',
    color: '#FFFFFF',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 4px 12px rgba(255,153,0,0.3)'
  },
  balanceLabel: {
    fontSize: '1em',
    opacity: 0.9,
    marginBottom: '10px'
  },
  balanceAmount: {
    fontSize: '3em',
    fontWeight: 'bold',
    marginBottom: '15px'
  },
  balanceInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
  },
  nextPayout: {
    background: 'rgba(255,255,255,0.2)',
    padding: '15px',
    borderRadius: '8px',
    flex: 1,
    minWidth: '200px'
  },
  nextPayoutLabel: {
    fontSize: '0.9em',
    opacity: 0.9,
    marginBottom: '5px'
  },
  nextPayoutDate: {
    fontSize: '1.3em',
    fontWeight: 'bold'
  },
  nextPayoutAmount: {
    fontSize: '1.3em',
    fontWeight: 'bold'
  },
  withdrawButton: {
    background: '#FFFFFF',
    color: '#FF9900',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em'
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
  secondaryButton: {
    background: '#FFFFFF',
    color: '#0F1111',
    border: '1px solid #D5D9D9',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  bankInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  bankDetail: {
    padding: '15px',
    background: '#F7F8F8',
    borderRadius: '8px'
  },
  bankLabel: {
    fontSize: '0.85em',
    color: '#565959',
    marginBottom: '5px'
  },
  bankValue: {
    fontSize: '1.1em',
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
    padding: '12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #D5D9D9',
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
  badgeCompleted: {
    background: '#E6F4F1',
    color: '#067D62'
  },
  badgeProcessing: {
    background: '#FFF4E5',
    color: '#F08804'
  },
  badgePending: {
    background: '#E7F3FF',
    color: '#146EB4'
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
    fontSize: '0.85em'
  }
};

export default SellerPayoutsPage;
