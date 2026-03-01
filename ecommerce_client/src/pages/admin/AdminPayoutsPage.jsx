import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminPayoutsPage = () => {
    const [payouts, setPayouts] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [stats, setStats] = useState({
        totalPaid: 0,
        pending: 0,
        thisMonth: 0,
        totalPayouts: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        seller: 'all',
        dateRange: '30days'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSellers();
    }, []);

    useEffect(() => {
        fetchPayouts();
    }, [filters]);

    const fetchSellers = async () => {
        try {
            const response = await adminAPI.getStripeSellers();
            setSellers(response.sellers || []);
        } catch (error) {
            console.error('Error fetching sellers:', error);
        }
    };

    const fetchPayouts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Use Stripe payments endpoint to get payout data
            const response = await adminAPI.getStripePayments({
                status: filters.status === 'all' ? undefined : filters.status,
                seller: filters.seller === 'all' ? undefined : filters.seller,
                dateRange: filters.dateRange,
                search: filters.search
            });
            
            const paymentsData = response.payments || [];
            
            // Transform payments to payout format
            const payoutsData = paymentsData.map(payment => ({
                id: payment.id,
                seller: payment.seller_name,
                seller_id: payment.seller_id,
                seller_name: payment.seller_name,
                amount: payment.seller_payout_amount / 100, // Convert cents to dollars
                ordersCount: 1, // Each payment represents one order
                orders_count: 1,
                method: 'Stripe',
                status: payment.status === 'paid' || payment.status === 'delivered' ? 'completed' : 
                        payment.status === 'pending_payment' ? 'pending' : payment.status,
                date: payment.created_at,
                created_at: payment.created_at
            }));
            
            setPayouts(payoutsData);
            
            // Calculate stats from payments
            if (payoutsData.length > 0) {
                const totalPaid = payoutsData
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                const pending = payoutsData
                    .filter(p => p.status === 'pending')
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                
                const now = new Date();
                const thisMonth = payoutsData
                    .filter(p => {
                        const payoutDate = new Date(p.date || p.created_at);
                        return payoutDate.getMonth() === now.getMonth() && 
                               payoutDate.getFullYear() === now.getFullYear();
                    })
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
                
                setStats({
                    totalPaid,
                    pending,
                    thisMonth,
                    totalPayouts: payoutsData.length
                });
            }
        } catch (error) {
            console.error('Error fetching payouts:', error);
            const errorMessage = error.message || 'Failed to load payouts';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'completed') return 'badge-completed';
        if (statusLower === 'pending') return 'badge-pending';
        if (statusLower === 'processing') return 'badge-processing';
        if (statusLower === 'failed') return 'badge-failed';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleProcessPayout = async (payout) => {
        try {
            if (!payout.seller_id || !payout.amount) {
                toast.error('Invalid payout data');
                return;
            }
            
            await adminAPI.processStripePayout({
                sellerId: payout.seller_id,
                amount: payout.amount,
                paymentId: payout.id
            });
            
            toast.success('Payout processed successfully');
            fetchPayouts();
        } catch (error) {
            console.error('Error processing payout:', error);
            toast.error(error.message || 'Failed to process payout');
        }
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading payouts...</div>
            </div>
        );
    }

    if (error && payouts.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchPayouts} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-payouts-page">
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
                
                table { width: 100%; border-collapse: collapse; }
                th { background: #F7F8F8; padding: 12px; text-align: left; font-weight: 600; }
                td { padding: 12px; border-bottom: 1px solid #D5D9D9; }
                
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
                .badge-completed { background: #E6F4F1; color: #067D62; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
                .badge-processing { background: #E7F3FF; color: #146EB4; }
                .badge-failed { background: #FFE5E5; color: #C7511F; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; font-size: 0.85em; }
                .btn-sm:hover { background: #F7F8F8; }
                .btn-process { padding: 6px 12px; border: 1px solid #067D62; background: #E6F4F1; color: #067D62; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: 600; }
                .btn-process:hover { background: #067D62; color: #FFFFFF; }
            `}</style>

            <h1>Payout Management</h1>
            <p className="subtitle">Manage seller payouts and commission payments</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">
                        ${stats.totalPaid >= 1000000 
                            ? (stats.totalPaid / 1000000).toFixed(2) + 'M' 
                            : stats.totalPaid >= 1000 
                            ? (stats.totalPaid / 1000).toFixed(1) + 'K' 
                            : stats.totalPaid.toFixed(2)}
                    </div>
                    <div className="stat-label">Total Paid Out</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        ${stats.pending >= 1000 
                            ? (stats.pending / 1000).toFixed(1) + 'K' 
                            : stats.pending.toFixed(2)}
                    </div>
                    <div className="stat-label">Pending Payouts</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        ${stats.thisMonth >= 1000 
                            ? (stats.thisMonth / 1000).toFixed(1) + 'K' 
                            : stats.thisMonth.toFixed(2)}
                    </div>
                    <div className="stat-label">This Month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalPayouts}</div>
                    <div className="stat-label">Total Payouts</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">All Payouts</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search payouts..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select value={filters.seller} onChange={(e) => handleFilterChange('seller', e.target.value)}>
                        <option value="all">All Sellers</option>
                        {sellers.map(seller => (
                            <option key={seller.id} value={seller.id}>
                                {seller.business_name || seller.display_name || seller.email}
                            </option>
                        ))}
                    </select>
                    <select value={filters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)}>
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                    </select>
                    <button className="btn-primary">Export</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Payout ID</th>
                            <th>Seller</th>
                            <th>Amount</th>
                            <th>Orders</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.length > 0 ? payouts.map((payout) => (
                            <tr key={payout.id}>
                                <td>{payout.id}</td>
                                <td>{payout.seller || payout.seller_name || 'N/A'}</td>
                                <td style={{ fontWeight: 600 }}>${(payout.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td>{payout.ordersCount || payout.orders_count || 0} orders</td>
                                <td>{payout.method || 'Bank Transfer'}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(payout.status)}`}>
                                        {(payout.status || 'pending').charAt(0).toUpperCase() + (payout.status || 'pending').slice(1)}
                                    </span>
                                </td>
                                <td>{new Date(payout.date || payout.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td>
                                    <button className="btn-sm">View</button>
                                    {payout.status === 'pending' && (
                                        <button className="btn-process" onClick={() => handleProcessPayout(payout)}>
                                            Process
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>💰</div>
                                    <div>No payouts found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPayoutsPage;
