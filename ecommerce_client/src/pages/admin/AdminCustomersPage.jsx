import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminCustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        newThisMonth: 0,
        active: 0,
        avgOrderValue: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        sortBy: 'recent'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, [filters]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('🔍 Fetching customers with filters:', filters);
            
            const response = await adminAPI.getUsers({ 
                ...filters, 
                role: 'customer',
                limit: 200, // Get more customers for better display
                offset: 0
            });
            
            console.log('✅ Customer response received:', {
                success: response?.success,
                count: response?.count,
                totalCount: response?.totalCount,
                hasUsers: !!response?.users,
                usersLength: response?.users?.length
            });
            
            // Handle different response formats - be very explicit
            let customersData = [];
            
            if (response && response.users && Array.isArray(response.users)) {
                customersData = response.users;
                console.log(`📊 Found ${customersData.length} customers from response.users`);
            } else if (response && response.data && Array.isArray(response.data)) {
                customersData = response.data;
                console.log(`📊 Found ${customersData.length} customers from response.data`);
            } else if (Array.isArray(response)) {
                customersData = response;
                console.log(`📊 Found ${customersData.length} customers from direct array`);
            } else {
                console.warn('⚠️  Unexpected response format:', response);
                customersData = [];
            }
            
            console.log(`✅ Setting ${customersData.length} customers to state`);
            setCustomers(customersData);
            
            // Calculate stats from the data we have
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            const thisMonth = customersData.filter(c => {
                if (!c.created_at) return false;
                const joinDate = new Date(c.created_at);
                return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
            });
            
            const activeCustomers = customersData.filter(c => c.status === 'active');
            
            const newStats = {
                total: response?.totalCount || customersData.length,
                newThisMonth: thisMonth.length,
                active: activeCustomers.length,
                avgOrderValue: 0 // TODO: Calculate from orders
            };
            
            console.log('📊 Calculated stats:', newStats);
            setStats(newStats);
            
        } catch (error) {
            console.error('❌ Error fetching customers:', error);
            const errorMessage = error?.message || 'Failed to load customers';
            setError(errorMessage);
            toast.error(errorMessage);
            // Set empty state on error
            setCustomers([]);
            setStats({
                total: 0,
                newThisMonth: 0,
                active: 0,
                avgOrderValue: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'active') return 'badge-active';
        if (statusLower === 'inactive') return 'badge-inactive';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            toast.loading('Generating customer PDF export...');
            
            const response = await adminAPI.exportCustomersPDF({
                role: 'customer',
                status: filters.status !== 'all' ? filters.status : undefined,
                search: filters.search || undefined
            });

            // Create blob from response
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `customers-export-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.dismiss();
            toast.success('Customer data exported to PDF successfully!');
        } catch (error) {
            console.error('Export error:', error);
            toast.dismiss();
            toast.error(error.message || 'Failed to export customer data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading customers...</div>
            </div>
        );
    }

    if (error && customers.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchCustomers} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-customers-page">
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
                .badge-active { background: #E6F4F1; color: #067D62; }
                .badge-inactive { background: #FFE5E5; color: #C7511F; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; font-size: 0.85em; }
                .btn-sm:hover { background: #F7F8F8; }
            `}</style>

            <h1>Customer Management</h1>
            <p className="subtitle">Manage all customer accounts and activity</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.total.toLocaleString()}</div>
                    <div className="stat-label">Total Customers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.newThisMonth.toLocaleString()}</div>
                    <div className="stat-label">New This Month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.active.toLocaleString()}</div>
                    <div className="stat-label">Active Customers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">${stats.avgOrderValue.toFixed(2)}</div>
                    <div className="stat-label">Avg. Order Value</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">All Customers</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                        <option value="recent">Sort: Recent</option>
                        <option value="orders">Sort: Most Orders</option>
                        <option value="spend">Sort: Highest Spend</option>
                    </select>
                    <button className="btn-primary" onClick={handleExport} disabled={loading}>
                        📥 Export PDF
                    </button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Orders</th>
                            <th>Total Spent</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length > 0 ? customers.map((customer) => {
                            // Get customer name with fallback logic
                            const customerName = customer.display_name || 
                                               customer.full_name || 
                                               (customer.first_name && customer.last_name ? 
                                                   `${customer.first_name} ${customer.last_name}` : 
                                                   customer.first_name || customer.last_name) ||
                                               'N/A';
                            
                            // Get join date
                            const joinDate = customer.created_at || customer.joinedAt;
                            const formattedDate = joinDate ? 
                                new Date(joinDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                }) : 'N/A';
                            
                            return (
                                <tr key={customer.id}>
                                    <td style={{ fontSize: '0.85em', color: '#565959' }}>
                                        {customer.id.slice(0, 8)}...
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{customerName}</td>
                                    <td>{customer.email}</td>
                                    <td>{customer.order_count || customer.orders || 0}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        ${((customer.total_spent || customer.totalSpent || 0) / 100).toLocaleString('en-US', { 
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadge(customer.status)}`}>
                                            {(customer.status || 'active').charAt(0).toUpperCase() + 
                                             (customer.status || 'active').slice(1)}
                                        </span>
                                    </td>
                                    <td>{formattedDate}</td>
                                    <td>
                                        <Link to={`/admin/customers/${customer.id}`} className="btn-sm">View</Link>
                                        <button className="btn-sm">Orders</button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>👥</div>
                                    <div>No customers found</div>
                                    {filters.search && <div style={{fontSize: '0.9em', marginTop: '10px'}}>Try adjusting your search or filters</div>}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCustomersPage;
