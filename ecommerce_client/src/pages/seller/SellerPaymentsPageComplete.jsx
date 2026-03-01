import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

/**
 * SELLER PAYMENTS DASHBOARD - COMPLETE
 * ====================================
 * 
 * Complete seller dashboard for payment management:
 * 1. Earnings overview and balance
 * 2. Commission breakdown
 * 3. Payout request and history
 * 4. Earnings timeline
 * 5. Payment method management
 */

const SellerPaymentsPageComplete = () => {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Earnings data
  const [earningsStats, setEarningsStats] = useState({
    total_earnings: 0,
    available_balance: 0,
    pending_balance: 0,
    paid_balance: 0
  });
  
  const [earnings, setEarnings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('stripe_connect');

  useEffect(() => {
    loadSellerPaymentData();
  }, []);

  const loadSellerPaymentData = async () => {
    try {
      setLoading(true);
      
      // Load earnings and balance
      await loadEarnings();
      
      // Load payout history
      await loadPayouts();
      
    } catch (error) {
      console.error('Error loading seller payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async () => {
    try {
      const response = await fetch('/api/stripe/seller/earnings', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEarningsStats(data.stats);
        setEarnings(data.earnings);
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const loadPayouts = async () => {
    try {
      const response = await fetch('/api/stripe/seller/payouts', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPayouts(data.payouts);
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }
    
    if (parseFloat(payoutAmount) > earningsStats.available_balance) {
      toast.error('Payout amount exceeds available balance');
      return;
    }
    
    try {
      const response = await fetch('/api/stripe/seller/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          method: payoutMethod
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Payout request submitted successfully');
        setPayoutAmount('');
        loadPayouts(); // Refresh payouts list
        loadEarnings(); // Refresh balance
      } else {
        toast.error(data.error || 'Payout request failed');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to submit payout request');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      available: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      pending_approval: 'bg-orange-100 text-orange-800',
      approved: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const calculateCommissionRate = (grossAmount, commissionAmount) => {
    if (!grossAmount || grossAmount === 0) return 0;
    return ((commissionAmount / grossAmount) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="seller-payments-loading">
        <div className="loading-spinner"></div>
        <p>Loading your payment data...</p>
      </div>
    );
  }

  return (
    <div className="seller-payments-dashboard">
      <div className="dashboard-header">
        <h1>Payments & Earnings</h1>
        <p>Manage your earnings, payouts, and payment methods</p>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Earnings History
        </button>
        <button
          className={`tab ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          Payouts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          {/* Balance Cards */}
          <div className="balance-grid">
            <div className="balance-card total">
              <div className="balance-icon">💰</div>
              <div className="balance-info">
                <h3>Total Earnings</h3>
                <p className="balance-amount">{formatCurrency(earningsStats.total_earnings)}</p>
                <span className="balance-label">All time</span>
              </div>
            </div>
            
            <div className="balance-card available">
              <div className="balance-icon">✅</div>
              <div className="balance-info">
                <h3>Available Balance</h3>
                <p className="balance-amount">{formatCurrency(earningsStats.available_balance)}</p>
                <span className="balance-label">Ready for payout</span>
              </div>
            </div>
            
            <div className="balance-card pending">
              <div className="balance-icon">⏳</div>
              <div className="balance-info">
                <h3>Pending Balance</h3>
                <p className="balance-amount">{formatCurrency(earningsStats.pending_balance)}</p>
                <span className="balance-label">7-day hold period</span>
              </div>
            </div>
            
            <div className="balance-card paid">
              <div className="balance-icon">🏦</div>
              <div className="balance-info">
                <h3>Paid Out</h3>
                <p className="balance-amount">{formatCurrency(earningsStats.paid_balance)}</p>
                <span className="balance-label">Already received</span>
              </div>
            </div>
          </div>

          {/* Payout Request Form */}
          {earningsStats.available_balance > 0 && (
            <div className="payout-request-section">
              <h3>Request Payout</h3>
              <form onSubmit={handlePayoutRequest} className="payout-form">
                <div className="form-group">
                  <label>Payout Amount</label>
                  <div className="amount-input">
                    <span className="currency-symbol">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={earningsStats.available_balance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <small>Available: {formatCurrency(earningsStats.available_balance)}</small>
                </div>
                
                <div className="form-group">
                  <label>Payout Method</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                  >
                    <option value="stripe_connect">Stripe Connect</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                
                <button type="submit" className="payout-btn">
                  Request Payout
                </button>
              </form>
            </div>
          )}

          {/* Commission Info */}
          <div className="commission-info">
            <h3>Commission Information</h3>
            <div className="commission-details">
              <div className="commission-item">
                <span>Platform Commission Rate:</span>
                <strong>15%</strong>
              </div>
              <div className="commission-item">
                <span>You Keep:</span>
                <strong>85%</strong>
              </div>
              <div className="commission-item">
                <span>Holding Period:</span>
                <strong>7 days</strong>
              </div>
              <div className="commission-item">
                <span>Payout Processing:</span>
                <strong>1-3 business days</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="earnings-tab">
          <h3>Earnings History</h3>
          
          {earnings.length === 0 ? (
            <div className="empty-state">
              <p>No earnings yet. Start selling to see your earnings here!</p>
            </div>
          ) : (
            <div className="earnings-table">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Gross Amount</th>
                    <th>Commission</th>
                    <th>Net Earnings</th>
                    <th>Status</th>
                    <th>Available Date</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.map(earning => (
                    <tr key={earning.id}>
                      <td>
                        <code>{earning.order_id?.substring(0, 8)}...</code>
                      </td>
                      <td className="amount">{formatCurrency(earning.gross_amount / 100)}</td>
                      <td className="commission">
                        -{formatCurrency(earning.commission_amount / 100)}
                        <small>({calculateCommissionRate(earning.gross_amount, earning.commission_amount)}%)</small>
                      </td>
                      <td className="net-amount">{formatCurrency(earning.net_amount / 100)}</td>
                      <td>{getStatusBadge(earning.status)}</td>
                      <td>{formatDate(earning.available_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="payouts-tab">
          <h3>Payout History</h3>
          
          {payouts.length === 0 ? (
            <div className="empty-state">
              <p>No payouts yet. Request your first payout when you have available balance!</p>
            </div>
          ) : (
            <div className="payouts-table">
              <table>
                <thead>
                  <tr>
                    <th>Payout ID</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(payout => (
                    <tr key={payout.id}>
                      <td>
                        <code>{payout.id.substring(0, 8)}...</code>
                      </td>
                      <td className="amount">{formatCurrency(payout.amount / 100)}</td>
                      <td>{payout.method.replace('_', ' ')}</td>
                      <td>{getStatusBadge(payout.status)}</td>
                      <td>{formatDate(payout.requested_at)}</td>
                      <td>
                        {payout.processed_at ? formatDate(payout.processed_at) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .seller-payments-dashboard {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }

        .dashboard-header p {
          color: #666;
          margin: 0;
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 2px solid #e1e5e9;
          margin-bottom: 30px;
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #007bff;
        }

        .tab.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }

        .balance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .balance-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e5e9;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: transform 0.2s;
        }

        .balance-card:hover {
          transform: translateY(-2px);
        }

        .balance-card.total {
          border-left: 4px solid #007bff;
        }

        .balance-card.available {
          border-left: 4px solid #28a745;
        }

        .balance-card.pending {
          border-left: 4px solid #ffc107;
        }

        .balance-card.paid {
          border-left: 4px solid #6c757d;
        }

        .balance-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .balance-info h3 {
          font-size: 14px;
          font-weight: 500;
          color: #666;
          margin: 0 0 5px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .balance-amount {
          font-size: 20px;
          font-weight: 600;
          color: #333;
          margin: 0 0 2px 0;
        }

        .balance-label {
          font-size: 12px;
          color: #999;
        }

        .payout-request-section {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e5e9;
          margin-bottom: 30px;
        }

        .payout-request-section h3 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .payout-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 20px;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .amount-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency-symbol {
          position: absolute;
          left: 12px;
          color: #666;
          font-weight: 500;
        }

        .amount-input input {
          padding: 10px 12px 10px 30px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 16px;
          width: 100%;
        }

        .form-group select {
          padding: 10px 12px;
          border: 1px solid #e1e5e9;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group small {
          color: #666;
          font-size: 12px;
        }

        .payout-btn {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          height: fit-content;
        }

        .payout-btn:hover {
          background: #218838;
        }

        .commission-info {
          background: white;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e1e5e9;
        }

        .commission-info h3 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .commission-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .commission-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f3f4;
        }

        .commission-item:last-child {
          border-bottom: none;
        }

        .earnings-table,
        .payouts-table {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #f8f9fa;
          padding: 15px 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #e1e5e9;
        }

        td {
          padding: 15px 12px;
          border-bottom: 1px solid #f1f3f4;
        }

        .amount {
          font-weight: 600;
          color: #333;
        }

        .commission {
          font-weight: 600;
          color: #dc3545;
        }

        .commission small {
          display: block;
          font-weight: normal;
          color: #666;
          font-size: 11px;
        }

        .net-amount {
          font-weight: 600;
          color: #28a745;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .seller-payments-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .payout-form {
            grid-template-columns: 1fr;
          }
          
          .balance-grid {
            grid-template-columns: 1fr;
          }
          
          .commission-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SellerPaymentsPageComplete;