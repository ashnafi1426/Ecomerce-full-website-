import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminPaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalPayments: 0,
        pendingPayments: 0,
        successfulPayments: 0,
        refundedAmount: 0,
        commissionEarned: 0,
        successRate: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        method: 'all',
        dateRange: '30days',
        seller: 'all'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [processingRefund, setProcessingRefund] = useState(false);
    const [processingPayout, setProcessingPayout] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutSeller, setPayoutSeller] = useState('');
    const [sellers, setSellers] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, [filters]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch payments, statistics, and sellers in parallel
            const [paymentsResponse, statsResponse, sellersResponse] = await Promise.all([
                adminAPI.getStripePayments(filters),
                adminAPI.getStripeStatistics(),
                adminAPI.getStripeSellers()
            ]);
            
            // Process payments data
            const paymentsData = paymentsResponse.payments || [];
            const formattedPayments = paymentsData.map(payment => ({
                id: payment.id,
                orderId: payment.order_id,
                customerId: payment.user_id,
                customerName: payment.customer_name || `Customer ${payment.user_id?.slice(0, 8)}`,
                amount: (payment.amount || 0) / 100, // Convert cents to dollars
                commission: (payment.commission_amount || 0) / 100,
                sellerPayout: (payment.seller_payout_amount || 0) / 100,
                method: payment.payment_method || 'stripe',
                status: payment.status || 'pending',
                date: payment.created_at,
                paymentIntentId: payment.stripe_payment_intent_id || payment.payment_intent_id,
                sellerId: payment.seller_id,
                sellerName: payment.seller_name || 'Multiple Sellers'
            }));
            
            // Process statistics data
            const statsData = statsResponse.stats || {};
            setStats({
                totalRevenue: statsData.totalRevenue || 0,
                totalPayments: statsData.totalPayments || 0,
                pendingPayments: statsData.pendingPayments || 0,
                successfulPayments: statsData.successfulPayments || 0,
                refundedAmount: statsData.refundedAmount || 0,
                commissionEarned: statsData.commissionEarned || 0,
                successRate: statsData.successRate || 0
            });
            
            // Process sellers data
            const sellersData = sellersResponse.sellers || [];
            
            setPayments(formattedPayments);
            setSellers(sellersData);
            
            // Calculate comprehensive statistics
            calculateStats(formattedPayments, []);
            
        } catch (error) {
            console.error('Error fetching admin payment data:', error);
            const errorMessage = error.message || 'Failed to load payment data';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (paymentsData, ordersData) => {
        // Payment statistics using correct status values
        const successfulPayments = paymentsData.filter(p => 
            ['paid', 'confirmed', 'packed', 'shipped', 'delivered'].includes(p.status)
        );
        const pendingPayments = paymentsData.filter(p => 
            ['pending_payment', 'processing'].includes(p.status)
        );
        const refundedPayments = paymentsData.filter(p => p.status === 'refunded');
        
        const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
        const refundedAmount = refundedPayments.reduce((sum, p) => sum + p.amount, 0);
        const commissionEarned = successfulPayments.reduce((sum, p) => sum + (p.commission || 0), 0);
        
        const successRate = paymentsData.length > 0 
            ? ((successfulPayments.length / paymentsData.length) * 100).toFixed(1)
            : 0;
        
        setStats({
            totalRevenue,
            totalPayments: paymentsData.length,
            pendingPayments: pendingPayments.length,
            successfulPayments: successfulPayments.length,
            refundedAmount,
            commissionEarned,
            successRate: parseFloat(successRate)
        });
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'paid' || statusLower === 'confirmed' || statusLower === 'delivered') return 'badge-success';
        if (statusLower === 'pending_payment' || statusLower === 'packed' || statusLower === 'shipped') return 'badge-pending';
        if (statusLower === 'cancelled' || statusLower === 'failed') return 'badge-failed';
        if (statusLower === 'refunded') return 'badge-refunded';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setShowDetailsModal(true);
    };

    const handleRefundClick = (payment) => {
        setSelectedPayment(payment);
        setRefundAmount(payment.amount.toFixed(2));
        setRefundReason('');
        setShowRefundModal(true);
    };

    const handlePayoutClick = (payment) => {
        setSelectedPayment(payment);
        setPayoutAmount(payment.sellerPayout?.toFixed(2) || '0.00');
        setPayoutSeller(payment.sellerId || '');
        setShowPayoutModal(true);
    };

    const handleProcessRefund = async () => {
        if (!selectedPayment) return;
        
        try {
            setProcessingRefund(true);
            const amountInCents = Math.round(parseFloat(refundAmount) * 100);
            
            const response = await fetch(`/api/stripe/admin/refund/${selectedPayment.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: amountInCents,
                    reason: refundReason
                })
            });

            const result = await response.json();
            
            if (result.success) {
                toast.success('Refund processed successfully');
                setShowRefundModal(false);
                fetchAllData(); // Refresh the data
            } else {
                throw new Error(result.error || 'Failed to process refund');
            }
        } catch (error) {
            console.error('Error processing refund:', error);
            toast.error(error.message || 'Failed to process refund');
        } finally {
            setProcessingRefund(false);
        }
    };

    const handleProcessPayout = async () => {
        if (!selectedPayment) return;
        
        try {
            setProcessingPayout(true);
            const amountInCents = Math.round(parseFloat(payoutAmount) * 100);
            
            const response = await fetch('/api/admin/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    sellerId: payoutSeller,
                    amount: amountInCents,
                    paymentId: selectedPayment.id
                })
            });

            const result = await response.json();
            
            if (result.success) {
                toast.success(`Payout of $${(amountInCents / 100).toFixed(2)} processed successfully`);
                setShowPayoutModal(false);
                fetchAllData(); // Refresh the data
            } else {
                throw new Error(result.message || result.error || 'Failed to process payout');
            }
        } catch (error) {
            console.error('Error processing payout:', error);
            toast.error(error.message || 'Failed to process payout');
        } finally {
            setProcessingPayout(false);
        }
    };

    const handleExportData = () => {
        try {
            const csvContent = [
                ['Payment ID', 'Order ID', 'Customer', 'Amount', 'Commission', 'Seller Payout', 'Status', 'Date', 'Payment Method'].join(','),
                ...payments.map(payment => [
                    payment.id,
                    payment.orderId || 'N/A',
                    payment.customerName,
                    `$${payment.amount.toFixed(2)}`,
                    `$${(payment.commission || 0).toFixed(2)}`,
                    `$${(payment.sellerPayout || 0).toFixed(2)}`,
                    payment.status,
                    new Date(payment.date).toLocaleDateString(),
                    payment.method
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin-payments-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success('Payment data exported successfully');
        } catch (error) {
            console.error('Failed to export data:', error);
            toast.error('Failed to export data');
        }
    };

    const closeModals = () => {
        setShowDetailsModal(false);
        setShowRefundModal(false);
        setShowPayoutModal(false);
        setSelectedPayment(null);
        setRefundAmount('');
        setRefundReason('');
        setPayoutAmount('');
        setPayoutSeller('');
    };

    // Filter payments based on current filters
    const filteredPayments = payments.filter(payment => {
        const searchMatch = !filters.search || 
            payment.id.toLowerCase().includes(filters.search.toLowerCase()) ||
            payment.orderId?.toLowerCase().includes(filters.search.toLowerCase()) ||
            payment.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
            payment.paymentIntentId?.toLowerCase().includes(filters.search.toLowerCase());
        
        const statusMatch = filters.status === 'all' || payment.status === filters.status;
        const methodMatch = filters.method === 'all' || payment.method === filters.method;
        const sellerMatch = filters.seller === 'all' || payment.sellerId === filters.seller;
        
        let dateMatch = true;
        if (filters.dateRange !== 'all') {
            const paymentDate = new Date(payment.date);
            const now = new Date();
            const daysDiff = (now - paymentDate) / (1000 * 60 * 60 * 24);
            
            switch (filters.dateRange) {
                case '7days': dateMatch = daysDiff <= 7; break;
                case '30days': dateMatch = daysDiff <= 30; break;
                case '90days': dateMatch = daysDiff <= 90; break;
                default: dateMatch = true;
            }
        }
        
        return searchMatch && statusMatch && methodMatch && sellerMatch && dateMatch;
    });

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading payment management system...</div>
            </div>
        );
    }

    if (error && payments.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchAllData} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-payments-page">
            <style>{`
                h1 { font-size: 2em; margin-bottom: 10px; }
                .subtitle { color: #565959; margin-bottom: 30px; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #FFFFFF; padding: 20px; border-radius: 8px; border: 1px solid #D5D9D9; }
                .stat-value { font-size: 2.5em; font-weight: bold; color: #FF9900; }
                .stat-label { font-size: 0.9em; color: #565959; margin-top: 8px; }
                
                .section { background: #FFFFFF; padding: 25px; border-radius: 8px; border: 1px solid #D5D9D9; margin-bottom: 20px; }
                .section-title { font-size: 1.4em; font-weight: 600; margin-bottom: 20px; }
                
                .filter-bar { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
                .filter-bar input, .filter-bar select { padding: 8px 12px; border: 1px solid #D5D9D9; border-radius: 4px; }
                .filter-bar input { flex: 1; min-width: 250px; }
                .btn-primary { background: #FF9900; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .btn-secondary { background: #0073BB; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-left: 10px; }
                
                table { width: 100%; border-collapse: collapse; }
                th { background: #F7F8F8; padding: 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #D5D9D9; }
                
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
                .badge-success { background: #E6F4F1; color: #067D62; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
                .badge-failed { background: #FFE5E5; color: #C7511F; }
                .badge-refunded { background: #E5E5E5; color: #565959; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; font-size: 0.85em; }
                .btn-sm:hover { background: #F7F8F8; }
                .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .modal-title { font-size: 1.5em; font-weight: 600; }
                .modal-close { background: none; border: none; font-size: 1.5em; cursor: pointer; color: #565959; }
                .modal-close:hover { color: #0F1111; }
                .modal-body { margin-bottom: 20px; }
                .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #D5D9D9; }
                .detail-label { font-weight: 600; color: #565959; }
                .detail-value { color: #0F1111; }
                .form-group { margin-bottom: 20px; }
                .form-label { display: block; margin-bottom: 8px; font-weight: 600; color: #0F1111; }
                .form-input, .form-textarea, .form-select { width: 100%; padding: 10px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 1em; }
                .form-textarea { min-height: 100px; resize: vertical; }
                .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
                .btn-cancel { background: #FFFFFF; color: #0F1111; border: 1px solid #D5D9D9; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .btn-cancel:hover { background: #F7F8F8; }
                .btn-danger { background: #C7511F; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .btn-danger:hover { background: #A73E17; }
                .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-success { background: #067D62; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .btn-success:hover { background: #055A47; }
                .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
                
                .commission-info { background: #E6F4F1; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #067D62; }
                .commission-breakdown { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 10px; }
                .commission-item { text-align: center; }
                .commission-amount { font-size: 1.2em; font-weight: bold; color: #067D62; }
                .commission-label { font-size: 0.85em; color: #565959; margin-top: 5px; }
            `}</style>

            <h1>💳 Payment Management System</h1>
            <p className="subtitle">Complete oversight of all customer payments, commissions, and seller payouts</p>

            {/* Enhanced Statistics Dashboard */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">
                        ${stats.totalRevenue >= 1000000 
                            ? (stats.totalRevenue / 1000000).toFixed(1) + 'M' 
                            : stats.totalRevenue >= 1000 
                            ? (stats.totalRevenue / 1000).toFixed(1) + 'K' 
                            : stats.totalRevenue.toFixed(2)}
                    </div>
                    <div className="stat-label">Total Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalPayments.toLocaleString()}</div>
                    <div className="stat-label">Total Payments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        ${stats.commissionEarned >= 1000 
                            ? (stats.commissionEarned / 1000).toFixed(1) + 'K' 
                            : stats.commissionEarned.toFixed(2)}
                    </div>
                    <div className="stat-label">Commission Earned</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.successfulPayments}</div>
                    <div className="stat-label">Successful Payments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingPayments}</div>
                    <div className="stat-label">Pending Payments</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.successRate}%</div>
                    <div className="stat-label">Success Rate</div>
                </div>
            </div>

            {/* Commission Overview */}
            <div className="section">
                <h2 className="section-title">💰 Commission & Revenue Breakdown</h2>
                <div className="commission-info">
                    <div className="commission-breakdown">
                        <div className="commission-item">
                            <div className="commission-amount">${stats.totalRevenue.toFixed(2)}</div>
                            <div className="commission-label">Total Customer Payments</div>
                        </div>
                        <div className="commission-item">
                            <div className="commission-amount">${stats.commissionEarned.toFixed(2)}</div>
                            <div className="commission-label">Admin Commission (15%)</div>
                        </div>
                        <div className="commission-item">
                            <div className="commission-amount">${(stats.totalRevenue - stats.commissionEarned).toFixed(2)}</div>
                            <div className="commission-label">Seller Payouts (85%)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Payment Management */}
            <div className="section">
                <h2 className="section-title">🔍 All Payment Transactions</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search by payment ID, order ID, customer name..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending_payment">Pending Payment</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <select value={filters.method} onChange={(e) => handleFilterChange('method', e.target.value)}>
                        <option value="all">All Methods</option>
                        <option value="stripe">Stripe</option>
                        <option value="card">Credit Card</option>
                        <option value="paypal">PayPal</option>
                    </select>
                    <select value={filters.seller} onChange={(e) => handleFilterChange('seller', e.target.value)}>
                        <option value="all">All Sellers</option>
                        {sellers.map(seller => (
                            <option key={seller.id} value={seller.id}>
                                {seller.business_name || seller.display_name || `Seller ${seller.id.slice(0, 8)}`}
                            </option>
                        ))}
                    </select>
                    <select value={filters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)}>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button className="btn-primary" onClick={handleExportData}>
                        📊 Export CSV
                    </button>
                </div>

                <div style={{marginBottom: '15px', color: '#565959'}}>
                    Showing {filteredPayments.length} of {payments.length} payments
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Commission</th>
                            <th>Seller Payout</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                            <tr key={payment.id}>
                                <td style={{fontSize: '0.85em', color: '#565959'}}>
                                    {payment.paymentIntentId?.slice(0, 20) || payment.id.slice(0, 20)}...
                                </td>
                                <td>
                                    {payment.orderId ? (
                                        <span style={{fontFamily: 'monospace', background: '#F7F8F8', padding: '2px 6px', borderRadius: '3px'}}>
                                            {payment.orderId.slice(0, 8).toUpperCase()}
                                        </span>
                                    ) : 'N/A'}
                                </td>
                                <td>{payment.customerName}</td>
                                <td style={{fontWeight: 'bold', color: '#067D62'}}>${payment.amount.toFixed(2)}</td>
                                <td style={{fontWeight: 'bold', color: '#FF9900'}}>${(payment.commission || 0).toFixed(2)}</td>
                                <td style={{fontWeight: 'bold', color: '#0073BB'}}>${(payment.sellerPayout || 0).toFixed(2)}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(payment.status)}`}>
                                        {(payment.status || 'pending').charAt(0).toUpperCase() + (payment.status || 'pending').slice(1)}
                                    </span>
                                </td>
                                <td>{new Date(payment.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</td>
                                <td>
                                    <button 
                                        className="btn-sm" 
                                        onClick={() => handleViewDetails(payment)}
                                        title="View Payment Details"
                                    >
                                        👁️ Details
                                    </button>
                                    {(payment.status === 'succeeded' || payment.status === 'completed') && (
                                        <>
                                            <button 
                                                className="btn-sm" 
                                                onClick={() => handleRefundClick(payment)}
                                                title="Process Refund"
                                                style={{color: '#C7511F'}}
                                            >
                                                💰 Refund
                                            </button>
                                            {payment.sellerPayout > 0 && (
                                                <button 
                                                    className="btn-sm" 
                                                    onClick={() => handlePayoutClick(payment)}
                                                    title="Process Seller Payout"
                                                    style={{color: '#0073BB'}}
                                                >
                                                    💸 Payout
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>💳</div>
                                    <div>No payments found matching your filters</div>
                                    {(filters.search || filters.status !== 'all' || filters.dateRange !== 'all') && (
                                        <button 
                                            onClick={() => setFilters({search: '', status: 'all', method: 'all', dateRange: '30days', seller: 'all'})}
                                            style={{marginTop: '10px', color: '#FF9900', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'}}
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Enhanced Payment Details Modal */}
            {showDetailsModal && selectedPayment && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">💳 Payment Details</h2>
                            <button className="modal-close" onClick={closeModals}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-row">
                                <span className="detail-label">Payment ID:</span>
                                <span className="detail-value" style={{fontFamily: 'monospace', fontSize: '0.9em'}}>
                                    {selectedPayment.paymentIntentId || selectedPayment.id}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Order ID:</span>
                                <span className="detail-value" style={{fontFamily: 'monospace'}}>
                                    {selectedPayment.orderId || 'N/A'}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Customer:</span>
                                <span className="detail-value">{selectedPayment.customerName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Total Amount:</span>
                                <span className="detail-value" style={{fontWeight: 'bold', fontSize: '1.2em', color: '#067D62'}}>
                                    ${selectedPayment.amount.toFixed(2)}
                                </span>
                            </div>
                            
                            {/* Commission Breakdown */}
                            <div className="commission-info">
                                <strong>💰 Commission Breakdown:</strong>
                                <div className="commission-breakdown">
                                    <div className="commission-item">
                                        <div className="commission-amount">${selectedPayment.amount.toFixed(2)}</div>
                                        <div className="commission-label">Customer Payment</div>
                                    </div>
                                    <div className="commission-item">
                                        <div className="commission-amount">${(selectedPayment.commission || 0).toFixed(2)}</div>
                                        <div className="commission-label">Admin Commission</div>
                                    </div>
                                    <div className="commission-item">
                                        <div className="commission-amount">${(selectedPayment.sellerPayout || 0).toFixed(2)}</div>
                                        <div className="commission-label">Seller Payout</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="detail-row">
                                <span className="detail-label">Payment Method:</span>
                                <span className="detail-value">{selectedPayment.method}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Status:</span>
                                <span className={`badge ${getStatusBadge(selectedPayment.status)}`}>
                                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Date & Time:</span>
                                <span className="detail-value">{new Date(selectedPayment.date).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}</span>
                            </div>
                            {selectedPayment.sellerId && (
                                <div className="detail-row">
                                    <span className="detail-label">Seller:</span>
                                    <span className="detail-value">{selectedPayment.sellerName}</span>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={closeModals}>Close</button>
                            {(['paid', 'confirmed', 'packed', 'shipped', 'delivered'].includes(selectedPayment.status)) && (
                                <>
                                    <button 
                                        className="btn-danger" 
                                        onClick={() => {
                                            closeModals();
                                            handleRefundClick(selectedPayment);
                                        }}
                                    >
                                        💰 Process Refund
                                    </button>
                                    {selectedPayment.sellerPayout > 0 && (
                                        <button 
                                            className="btn-success" 
                                            onClick={() => {
                                                closeModals();
                                                handlePayoutClick(selectedPayment);
                                            }}
                                        >
                                            💸 Process Payout
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Refund Modal */}
            {showRefundModal && selectedPayment && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">💰 Process Refund</h2>
                            <button className="modal-close" onClick={closeModals}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{background: '#FFE5E5', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #C7511F'}}>
                                <strong>⚠️ Warning:</strong> This action cannot be undone. The refund will be processed immediately and the customer will be notified.
                            </div>
                            
                            <div className="detail-row">
                                <span className="detail-label">Payment ID:</span>
                                <span className="detail-value" style={{fontFamily: 'monospace', fontSize: '0.9em'}}>
                                    {selectedPayment.paymentIntentId?.slice(0, 40) || selectedPayment.id.slice(0, 40)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Customer:</span>
                                <span className="detail-value">{selectedPayment.customerName}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Original Amount:</span>
                                <span className="detail-value" style={{fontWeight: 'bold', color: '#067D62'}}>
                                    ${selectedPayment.amount.toFixed(2)}
                                </span>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Refund Amount ($)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    min="0"
                                    max={selectedPayment.amount}
                                    step="0.01"
                                    placeholder="Enter refund amount"
                                />
                                <small style={{color: '#565959', display: 'block', marginTop: '5px'}}>
                                    Maximum refundable: ${selectedPayment.amount.toFixed(2)}
                                </small>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Reason for Refund</label>
                                <textarea
                                    className="form-textarea"
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    placeholder="Enter detailed reason for refund (required for audit trail)"
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={closeModals} disabled={processingRefund}>
                                Cancel
                            </button>
                            <button 
                                className="btn-danger" 
                                onClick={handleProcessRefund}
                                disabled={processingRefund || !refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > selectedPayment.amount || !refundReason.trim()}
                            >
                                {processingRefund ? 'Processing Refund...' : 'Process Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Seller Payout Modal */}
            {showPayoutModal && selectedPayment && (
                <div className="modal-overlay" onClick={closeModals}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">💸 Process Seller Payout</h2>
                            <button className="modal-close" onClick={closeModals}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{background: '#E6F4F1', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #067D62'}}>
                                <strong>💡 Info:</strong> This will transfer the seller's portion of the payment after commission deduction.
                            </div>
                            
                            <div className="detail-row">
                                <span className="detail-label">Payment ID:</span>
                                <span className="detail-value" style={{fontFamily: 'monospace', fontSize: '0.9em'}}>
                                    {selectedPayment.paymentIntentId?.slice(0, 40) || selectedPayment.id.slice(0, 40)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Original Amount:</span>
                                <span className="detail-value">${selectedPayment.amount.toFixed(2)}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Commission (15%):</span>
                                <span className="detail-value" style={{color: '#FF9900'}}>
                                    ${(selectedPayment.commission || 0).toFixed(2)}
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Seller Payout (85%):</span>
                                <span className="detail-value" style={{fontWeight: 'bold', color: '#067D62'}}>
                                    ${(selectedPayment.sellerPayout || 0).toFixed(2)}
                                </span>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Select Seller</label>
                                <select
                                    className="form-select"
                                    value={payoutSeller}
                                    onChange={(e) => setPayoutSeller(e.target.value)}
                                >
                                    <option value="">Select seller...</option>
                                    {sellers.map(seller => (
                                        <option key={seller.id} value={seller.id}>
                                            {seller.business_name || seller.display_name || `Seller ${seller.id.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Payout Amount ($)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    min="0"
                                    max={selectedPayment.sellerPayout}
                                    step="0.01"
                                    placeholder="Enter payout amount"
                                />
                                <small style={{color: '#565959', display: 'block', marginTop: '5px'}}>
                                    Maximum payout: ${(selectedPayment.sellerPayout || 0).toFixed(2)}
                                </small>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={closeModals} disabled={processingPayout}>
                                Cancel
                            </button>
                            <button 
                                className="btn-success" 
                                onClick={handleProcessPayout}
                                disabled={processingPayout || !payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > (selectedPayment.sellerPayout || 0) || !payoutSeller}
                            >
                                {processingPayout ? 'Processing Payout...' : 'Process Payout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentsPage;
