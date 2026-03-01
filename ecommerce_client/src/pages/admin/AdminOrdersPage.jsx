import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        processing: 0,
        shippedToday: 0,
        totalValue: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        seller: 'all',
        dateRange: '7days'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminAPI.getOrders(filters);
            setOrders(data.orders || []);
            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            const errorMessage = error.message || 'Failed to load orders';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'delivered') return 'badge-delivered';
        if (statusLower === 'processing' || statusLower === 'pending') return 'badge-processing';
        if (statusLower === 'cancelled') return 'badge-cancelled';
        return 'badge-processing';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading orders...</div>
            </div>
        );
    }

    return (
        <div className="admin-orders-page">
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
                .badge-delivered { background: #E6F4F1; color: #067D62; }
                .badge-processing { background: #FFF4E5; color: #F08804; }
                .badge-cancelled { background: #FFE5E5; color: #C7511F; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; }
                .btn-sm:hover { background: #F7F8F8; }
            `}</style>

            <h1>Order Management</h1>
            <p className="subtitle">Monitor and manage all orders across the platform</p>

            {error && (
                <div style={{background: '#FEE', border: '1px solid #C7511F', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: '#C7511F'}}>
                    <strong>Error:</strong> {error}
                    <button onClick={() => setError(null)} style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em'}}>×</button>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalOrders.toLocaleString()}</div>
                    <div className="stat-label">Total Orders</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.processing}</div>
                    <div className="stat-label">Processing</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.shippedToday}</div>
                    <div className="stat-label">Shipped Today</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">${(stats.totalValue / 1000000).toFixed(1)}M</div>
                    <div className="stat-label">Total Value</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">All Orders</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={filters.seller} onChange={(e) => handleFilterChange('seller', e.target.value)}>
                        <option value="all">All Sellers</option>
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
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Seller</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? orders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.id || order.orderNumber}</td>
                                <td>{order.customer?.name || order.customerName || 'Unknown'}</td>
                                <td>{order.seller?.name || order.sellerName || 'Unknown'}</td>
                                <td>${order.amount?.toFixed(2) || order.total?.toFixed(2)}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(order.status)}`}>
                                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                    </span>
                                </td>
                                <td>{new Date(order.date || order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td>
                                    <Link to={`/admin/orders/${order.id}`} className="btn-sm">View</Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>📦</div>
                                    <div>No orders found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminOrdersPage;
