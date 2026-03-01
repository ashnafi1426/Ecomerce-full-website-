import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminRefundsPage = () => {
    const [refunds, setRefunds] = useState([]);
    const [stats, setStats] = useState({
        totalRefunded: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        dateRange: '30days'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRefunds();
    }, [filters]);

    const fetchRefunds = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getRefunds(filters);
            const refundsData = response.refunds || response.data || [];
            setRefunds(refundsData);
            
            // Calculate stats
            if (refundsData.length > 0) {
                const totalRefunded = refundsData
                    .filter(r => r.status === 'approved')
                    .reduce((sum, r) => sum + (r.amount || 0), 0);
                
                setStats({
                    totalRefunded,
                    pending: refundsData.filter(r => r.status === 'pending').length,
                    approved: refundsData.filter(r => r.status === 'approved').length,
                    rejected: refundsData.filter(r => r.status === 'rejected').length
                });
            }
        } catch (error) {
            console.error('Error fetching refunds:', error);
            const errorMessage = error.message || 'Failed to load refunds';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'approved') return 'badge-approved';
        if (statusLower === 'pending') return 'badge-pending';
        if (statusLower === 'rejected') return 'badge-rejected';
        if (statusLower === 'processing') return 'badge-processing';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApprove = async (refundId) => {
        try {
            await adminAPI.approveRefund(refundId);
            toast.success('Refund approved successfully');
            fetchRefunds();
        } catch (error) {
            console.error('Error approving refund:', error);
            toast.error(error.message || 'Failed to approve refund');
        }
    };

    const handleReject = async (refundId) => {
        try {
            await adminAPI.rejectRefund(refundId);
            toast.success('Refund rejected');
            fetchRefunds();
        } catch (error) {
            console.error('Error rejecting refund:', error);
            toast.error(error.message || 'Failed to reject refund');
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading refunds...</div>
            </div>
        );
    }

    if (error && refunds.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchRefunds} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-refunds-page">
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
                .badge-approved { background: #E6F4F1; color: #067D62; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
                .badge-rejected { background: #FFE5E5; color: #C7511F; }
                .badge-processing { background: #E7F3FF; color: #146EB4; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; font-size: 0.85em; }
                .btn-sm:hover { background: #F7F8F8; }
                .btn-approve { padding: 6px 14px; border: 1px solid #067D62; background: #E6F4F1; color: #067D62; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: 600; margin-right: 5px; }
                .btn-approve:hover { background: #067D62; color: #FFFFFF; }
                .btn-reject { padding: 6px 14px; border: 1px solid #C7511F; background: #FFE5E5; color: #C7511F; border-radius: 4px; cursor: pointer; font-size: 0.85em; font-weight: 600; }
                .btn-reject:hover { background: #C7511F; color: #FFFFFF; }
            `}</style>

            <h1>Refund Management</h1>
            <p className="subtitle">Process and manage customer refund requests</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">${(stats.totalRefunded / 1000).toFixed(0)}K</div>
                    <div className="stat-label">Total Refunded</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.approved}</div>
                    <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.rejected}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">Refund Requests</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search refunds..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="processing">Processing</option>
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
                            <th>Refund ID</th>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Requested</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.length > 0 ? refunds.map((refund) => (
                            <tr key={refund.id}>
                                <td>{refund.id}</td>
                                <td>{refund.orderId || refund.order_id}</td>
                                <td>{refund.customer || refund.customer_name || 'N/A'}</td>
                                <td style={{ fontWeight: 600 }}>${(refund.amount || 0).toFixed(2)}</td>
                                <td>{refund.reason || 'No reason provided'}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(refund.status)}`}>
                                        {(refund.status || 'pending').charAt(0).toUpperCase() + (refund.status || 'pending').slice(1)}
                                    </span>
                                </td>
                                <td>{formatTimestamp(refund.requestedAt || refund.created_at)}</td>
                                <td>
                                    <button className="btn-sm">View</button>
                                    {refund.status === 'pending' && (
                                        <>
                                            <button className="btn-approve" onClick={() => handleApprove(refund.id)}>
                                                ✓ Approve
                                            </button>
                                            <button className="btn-reject" onClick={() => handleReject(refund.id)}>
                                                ✗ Reject
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>💰</div>
                                    <div>No refunds found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRefundsPage;
