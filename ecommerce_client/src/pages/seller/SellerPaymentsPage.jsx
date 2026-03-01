import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SellerPaymentsPage = () => {
  const [balance, setBalance] = useState({
    available: 0,
    pending: 0,
    paid: 0,
    total_earnings: 0
  });
  const [earnings, setEarnings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to view payment data');
        return;
      }
      
      // Fetch earnings (this includes balance information)
      const earningsRes = await fetch(`${API_URL}/seller/earnings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!earningsRes.ok) {
        throw new Error(`Earnings API returned ${earningsRes.status}: ${earningsRes.statusText}`);
      }
      
      const earningsData = await earningsRes.json();
      
      if (earningsData.success && earningsData.stats) {
        // Convert dollars back to cents for internal calculations
        setBalance({
          available: Math.round((earningsData.stats.available_balance || 0) * 100),
          pending: Math.round((earningsData.stats.pending_balance || 0) * 100),
          paid: Math.round((earningsData.stats.paid_balance || 0) * 100),
          total_earnings: Math.round((earningsData.stats.total_earnings || 0) * 100)
        });
        setEarnings(earningsData.earnings || []);
      } else {
        console.error('Earnings API error:', earningsData);
        toast.error(earningsData.error || 'Failed to load earnings data');
      }
      
      // Fetch payouts
      const payoutsRes = await fetch(`${API_URL}/seller/payouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!payoutsRes.ok) {
        throw new Error(`Payouts API returned ${payoutsRes.status}: ${payoutsRes.statusText}`);
      }
      
      const payoutsData = await payoutsRes.json();
      
      if (payoutsData.success) {
        setPayouts(payoutsData.payouts || []);
      } else {
        console.error('Payouts API error:', payoutsData);
        toast.warning(payoutsData.error || 'Could not load payout history');
      }
      
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error(error.message || 'Failed to load payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amountInDollars = parseFloat(payoutAmount);
    
    if (amountInDollars > (balance.available / 100)) {
      toast.error(`Insufficient available balance. You have $${(balance.available / 100).toFixed(2)} available.`);
      return;
    }

    if (amountInDollars < 20) {
      toast.error('Minimum payout amount is $20.00');
      return;
    }

    try {
      setProcessingPayout(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to request payout');
        return;
      }
      
      const response = await fetch(`${API_URL}/seller/payouts/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInDollars, // Send in dollars, not cents
          method: 'bank_transfer',
          account_details: {
            bank_name: 'Test Bank',
            account_number: '****1234',
            routing_number: '****5678'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Payout request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Payout requested successfully! Admin will review your request.');
        setShowPayoutModal(false);
        setPayoutAmount('');
        fetchPaymentData();
      } else {
        toast.error(data.error || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(error.message || 'Failed to request payout. Please try again.');
    } finally {
      setProcessingPayout(false);
    }
  };
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: '#FFF4E5', color: '#F08804', text: 'Pending' },
      'processing': { bg: '#E3F2FD', color: '#1976D2', text: 'Processing' },
      'available': { bg: '#E6F4F1', color: '#067D62', text: 'Available' },
      'paid': { bg: '#E6F4F1', color: '#067D62', text: 'Paid' },
      'pending_approval': { bg: '#FFF4E5', color: '#F08804', text: 'Pending Approval' },
      'approved': { bg: '#E3F2FD', color: '#1976D2', text: 'Approved' },
      'completed': { bg: '#E6F4F1', color: '#067D62', text: 'Completed' },
      'failed': { bg: '#FFE5E5', color: '#C7511F', text: 'Failed' },
      'rejected': { bg: '#FFE5E5', color: '#C7511F', text: 'Rejected' }
    };
    
    const style = statusMap[status] || statusMap['pending'];
    
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85em',
        fontWeight: 'bold'
      }}>
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '80px 20px'}}>
        <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
        <div style={{fontSize: '1.2em', color: '#565959'}}>Loading payment data...</div>
      </div>
    );
  }

  return (
    <div className="seller-payments-page" style={{padding: '20px', maxWidth: '1400px', margin: '0 auto'}}>
      <style>{`
        h1 { font-size: 2em; margin-bottom: 10px; }
        .subtitle { color: #565959; margin-bottom: 30px; }
        
        .balance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .balance-card { background: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #D5D9D9; }
        .balance-label { font-size: 0.9em; color: #565959; margin-bottom: 10px; }
        .balance-amount { font-size: 2.5em; font-weight: bold; color: #FF9900; margin-bottom: 15px; }
        .balance-card button { background: #FF9900; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
        .balance-card button:hover { background: #E88B00; }
        .balance-card button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .section { background: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
        .section-title { font-size: 1.4em; font-weight: 600; margin-bottom: 20px; }
        
        table { width: 100%; border-collapse: collapse; }
        th { background: #F7F8F8; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #D5D9D9; }
        td { padding: 12px; border-bottom: 1px solid #D5D9D9; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal { background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-title { font-size: 1.5em; font-weight: 600; }
        .modal-close { background: none; border: none; font-size: 1.5em; cursor: pointer; color: #565959; }
        .modal-close:hover { color: #0F1111; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; }
        .form-input { width: 100%; padding: 10px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 1em; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel { background: #FFFFFF; color: #0F1111; border: 1px solid #D5D9D9; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-cancel:hover { background: #F7F8F8; }
        .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-primary:hover { background: #E88B00; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <h1>💰 Payments & Earnings</h1>
      <p className="subtitle">Manage your earnings and request payouts</p>

      {/* Balance Cards */}
      <div className="balance-grid">
        <div className="balance-card">
          <div className="balance-label">Available Balance</div>
          <div className="balance-amount">${(balance.available / 100).toFixed(2)}</div>
          <button 
            onClick={() => setShowPayoutModal(true)}
            disabled={balance.available <= 0}
          >
            Request Payout
          </button>
        </div>
        
        <div className="balance-card">
          <div className="balance-label">Pending (Holding Period)</div>
          <div className="balance-amount" style={{color: '#F08804'}}>${(balance.pending / 100).toFixed(2)}</div>
          <small style={{color: '#565959'}}>Available in 7 days after delivery</small>
        </div>
        
        <div className="balance-card">
          <div className="balance-label">Total Paid Out</div>
          <div className="balance-amount" style={{color: '#067D62'}}>${(balance.paid / 100).toFixed(2)}</div>
          <small style={{color: '#565959'}}>Successfully transferred</small>
        </div>
        
        <div className="balance-card">
          <div className="balance-label">Total Earnings</div>
          <div className="balance-amount" style={{color: '#232F3E'}}>${(balance.total_earnings / 100).toFixed(2)}</div>
          <small style={{color: '#565959'}}>All-time earnings</small>
        </div>
      </div>

      {/* Earnings History */}
      <div className="section">
        <h2 className="section-title">Earnings History</h2>
        {earnings.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Gross Amount</th>
                <th>Commission</th>
                <th>Your Earnings</th>
                <th>Status</th>
                <th>Available Date</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map(earning => (
                <tr key={earning.id}>
                  <td>{new Date(earning.created_at).toLocaleDateString()}</td>
                  <td>{earning.order_id?.slice(0, 8) || 'N/A'}</td>
                  <td>${(earning.gross_amount || 0).toFixed(2)}</td>
                  <td style={{color: '#C7511F'}}>-${(earning.commission_amount || 0).toFixed(2)}</td>
                  <td style={{fontWeight: 'bold', color: '#067D62'}}>${(earning.net_amount || 0).toFixed(2)}</td>
                  <td>{getStatusBadge(earning.status)}</td>
                  <td>{earning.available_date ? new Date(earning.available_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
            <div style={{fontSize: '2em', marginBottom: '10px'}}>💸</div>
            <div style={{fontSize: '1.1em', marginBottom: '10px'}}>No earnings yet</div>
            <div style={{fontSize: '0.9em'}}>Start selling products to earn money! Your earnings will appear here once customers purchase your products.</div>
          </div>
        )}
      </div>

      {/* Payout History */}
      <div className="section">
        <h2 className="section-title">Payout History</h2>
        {payouts.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Requested Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(payout => (
                <tr key={payout.id}>
                  <td>{payout.id.slice(0, 8)}</td>
                  <td>{new Date(payout.requested_at).toLocaleDateString()}</td>
                  <td style={{fontWeight: 'bold'}}>${(payout.amount || 0).toFixed(2)}</td>
                  <td style={{textTransform: 'capitalize'}}>{(payout.method || 'bank_transfer').replace('_', ' ')}</td>
                  <td>{getStatusBadge(payout.status)}</td>
                  <td>{payout.completed_at ? new Date(payout.completed_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
            <div style={{fontSize: '2em', marginBottom: '10px'}}>💳</div>
            <div style={{fontSize: '1.1em', marginBottom: '10px'}}>No payout requests yet</div>
            <div style={{fontSize: '0.9em'}}>Once you have available balance, you can request payouts here. Minimum payout amount is $20.00.</div>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="modal-overlay" onClick={() => setShowPayoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Payout</h2>
              <button className="modal-close" onClick={() => setShowPayoutModal(false)}>×</button>
            </div>
            
            <div style={{background: '#E6F4F1', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #067D62'}}>
              <strong>Available Balance:</strong> ${(balance.available / 100).toFixed(2)}
            </div>
            
            <div className="form-group">
              <label className="form-label">Payout Amount ($)</label>
              <input
                type="number"
                className="form-input"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                min="0"
                max={balance.available / 100}
                step="0.01"
                placeholder="Enter amount"
              />
              <small style={{color: '#565959', display: 'block', marginTop: '5px'}}>
                Maximum: ${(balance.available / 100).toFixed(2)}
              </small>
            </div>
            
            <div style={{background: '#FFF4E5', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #F08804'}}>
              <strong>Note:</strong> Payout requests are reviewed by admin and typically processed within 1-2 business days.
            </div>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPayoutModal(false)} disabled={processingPayout}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleRequestPayout}
                disabled={processingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0}
              >
                {processingPayout ? 'Processing...' : 'Request Payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPaymentsPage;
