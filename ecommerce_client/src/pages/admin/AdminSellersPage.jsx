import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminSellersPage = () => {
    const [sellers, setSellers] = useState([]);
    const [stats, setStats] = useState({
        totalSellers: 0,
        activeSellers: 0,
        pendingApproval: 0,
        verifiedSellers: 0,
        suspendedSellers: 0,
        totalRevenue: 0,
        totalProducts: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        verificationStatus: 'all',
        dateRange: '30days'
    });
    const [pagination, setPagination] = useState({
        limit: 20,
        offset: 0,
        totalPages: 1,
        currentPage: 1,
        hasNext: false,
        hasPrev: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        businessName: '',
        businessDescription: '',
        businessEmail: '',
        businessPhone: '',
        businessAddress: '',
        taxId: '',
        phone: '',
        sellerTier: 'bronze'
    });

    useEffect(() => {
        fetchSellers();
    }, [filters, pagination.limit, pagination.offset]);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                search: filters.search || undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
                verificationStatus: filters.verificationStatus !== 'all' ? filters.verificationStatus : undefined,
                limit: pagination.limit,
                offset: pagination.offset
            };
            
            console.log('🔍 Fetching sellers with params:', params);
            const response = await adminAPI.getSellers(params);
            console.log('✅ Sellers response:', response);
            
            // Handle response data structure - response.data contains the actual API response
            const apiResponse = response.data || response;
            const sellersData = apiResponse.sellers || apiResponse.data || [];
            setSellers(sellersData);
            
            // Update stats from response
            if (apiResponse.stats) {
                setStats(apiResponse.stats);
            } else {
                // Calculate stats from data if not provided
                setStats({
                    totalSellers: apiResponse.totalCount || sellersData.length,
                    activeSellers: sellersData.filter(s => s.status === 'active').length,
                    pendingApproval: sellersData.filter(s => s.verificationStatus === 'pending').length,
                    verifiedSellers: sellersData.filter(s => s.verificationStatus === 'verified').length,
                    suspendedSellers: sellersData.filter(s => s.status === 'suspended').length,
                    totalRevenue: sellersData.reduce((sum, s) => sum + (s.revenue || 0), 0),
                    totalProducts: sellersData.reduce((sum, s) => sum + (s.products || 0), 0)
                });
            }
            
            // Update pagination
            if (apiResponse.pagination) {
                setPagination(prev => ({
                    ...prev,
                    ...apiResponse.pagination
                }));
            }
            
        } catch (error) {
            console.error('Error fetching sellers:', error);
            const errorMessage = error.message || 'Failed to load sellers';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSeller = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            // Validate required fields
            if (!formData.email || !formData.password || !formData.businessName || !formData.businessAddress) {
                toast.error('Please fill in all required fields');
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                toast.error('Please enter a valid email address');
                return;
            }
            
            // Validate password strength
            if (formData.password.length < 6) {
                toast.error('Password must be at least 6 characters long');
                return;
            }
            
            await adminAPI.createSeller(formData);
            toast.success('Seller created successfully');
            setShowCreateModal(false);
            resetForm();
            fetchSellers();
        } catch (error) {
            console.error('Create seller error:', error);
            toast.error(error.message || 'Failed to create seller');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateSeller = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            // Validate required fields (excluding password for updates)
            if (!formData.businessName || !formData.businessAddress) {
                toast.error('Business name and address are required');
                return;
            }
            
            // Validate email format if provided
            if (formData.email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    toast.error('Please enter a valid email address');
                    return;
                }
            }
            
            // Remove empty password field for updates
            const updateData = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
            }
            
            await adminAPI.updateSeller(selectedSeller.id, updateData);
            toast.success('Seller updated successfully');
            setShowEditModal(false);
            resetForm();
            fetchSellers();
        } catch (error) {
            console.error('Update seller error:', error);
            toast.error(error.message || 'Failed to update seller');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteSeller = async (seller) => {
        const confirmMessage = `Are you sure you want to delete seller "${seller.name || seller.businessName}"?\n\nThis action cannot be undone and will:\n• Remove the seller account\n• Deactivate all their products\n• Cancel pending orders\n\nType "DELETE" to confirm:`;
        
        const confirmation = window.prompt(confirmMessage);
        
        if (confirmation === 'DELETE') {
            try {
                await adminAPI.deleteSeller(seller.id);
                toast.success('Seller deleted successfully');
                fetchSellers();
            } catch (error) {
                toast.error(error.message || 'Failed to delete seller');
            }
        } else if (confirmation !== null) {
            toast.error('Deletion cancelled - confirmation text did not match');
        }
    };

    const handleUpdateStatus = async (seller, newStatus) => {
        try {
            await adminAPI.updateSellerStatus(seller.id, { status: newStatus });
            toast.success(`Seller status updated to ${newStatus}`);
            fetchSellers();
        } catch (error) {
            toast.error(error.message || 'Failed to update seller status');
        }
    };

    const handleVerifySeller = async (seller, status, reason = '') => {
        try {
            if (status === 'rejected' && !reason) {
                const userReason = window.prompt('Please provide a reason for rejection:');
                if (!userReason) {
                    toast.error('Rejection reason is required');
                    return;
                }
                reason = userReason;
            }
            
            await adminAPI.verifySeller(seller.id, { status, reason });
            toast.success(`Seller ${status} successfully`);
            fetchSellers();
        } catch (error) {
            toast.error(error.message || `Failed to ${status} seller`);
        }
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (seller) => {
        setSelectedSeller(seller);
        setFormData({
            email: seller.email || '',
            password: '', // Don't populate password for security
            displayName: seller.displayName || '',
            businessName: seller.businessName || '',
            businessDescription: seller.businessDescription || '',
            businessEmail: seller.businessEmail || '',
            businessPhone: seller.businessPhone || '',
            businessAddress: seller.businessAddress || '',
            taxId: seller.taxId || '',
            phone: seller.phone || '',
            sellerTier: seller.sellerTier || 'bronze'
        });
        setShowEditModal(true);
    };

    const openViewModal = (seller) => {
        setSelectedSeller(seller);
        setShowViewModal(true);
    };

    const handleExportSellers = async () => {
        try {
            const exportData = sellers.map(seller => ({
                'Seller ID': seller.id,
                'Store Name': seller.name || seller.businessName || 'Unknown Store',
                'Email': seller.email,
                'Business Name': seller.businessName || '',
                'Business Email': seller.businessEmail || '',
                'Business Phone': seller.businessPhone || '',
                'Business Address': seller.businessAddress || '',
                'Tax ID': seller.taxId || '',
                'Products': seller.products || 0,
                'Approved Products': seller.approvedProducts || 0,
                'Revenue': seller.revenue || 0,
                'Status': seller.status || 'active',
                'Verification Status': seller.verificationStatus || 'pending',
                'Seller Tier': seller.sellerTier || 'basic',
                'Joined Date': new Date(seller.joined).toLocaleDateString()
            }));
            
            // Convert to CSV
            const headers = Object.keys(exportData[0]);
            const csvContent = [
                headers.join(','),
                ...exportData.map(row => headers.map(header => `"${row[header]}"`).join(','))
            ].join('\n');
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `sellers-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Sellers data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export sellers data');
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            displayName: '',
            businessName: '',
            businessDescription: '',
            businessEmail: '',
            businessPhone: '',
            businessAddress: '',
            taxId: '',
            phone: '',
            sellerTier: 'bronze'
        });
        setSelectedSeller(null);
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'active') return 'badge-active';
        if (statusLower === 'pending') return 'badge-pending';
        if (statusLower === 'suspended') return 'badge-suspended';
        return 'badge-pending';
    };

    const getVerificationBadge = (verificationStatus) => {
        const statusLower = verificationStatus?.toLowerCase();
        if (statusLower === 'verified') return 'badge-active';
        if (statusLower === 'pending') return 'badge-pending';
        if (statusLower === 'rejected') return 'badge-suspended';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, offset: 0, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        const newOffset = (newPage - 1) * pagination.limit;
        setPagination(prev => ({
            ...prev,
            offset: newOffset,
            currentPage: newPage
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading sellers...</div>
            </div>
        );
    }

    if (error && sellers.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchSellers} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-sellers-page">
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
                
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; margin-right: 5px; }
                .badge-active { background: #E6F4F1; color: #067D62; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
                .badge-suspended { background: #FFE5E5; color: #C7511F; }
                
                .btn-sm { padding: 6px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; text-decoration: none; color: #0F1111; margin-right: 5px; }
                .btn-sm:hover { background: #F7F8F8; }
                
                .pagination { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 20px; }
                .pagination button { padding: 8px 12px; border: 1px solid #D5D9D9; background: #FFFFFF; border-radius: 4px; cursor: pointer; }
                .pagination button:hover { background: #F7F8F8; }
                .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination .active { background: #FF9900; color: white; border-color: #FF9900; }
                
                /* Modal Styles */
                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
                .modal-content { background: #FFFFFF; border-radius: 8px; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 25px; border-bottom: 1px solid #D5D9D9; }
                .modal-header h3 { margin: 0; font-size: 1.3em; font-weight: 600; }
                .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #565959; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; }
                .modal-close:hover { color: #C7511F; }
                
                /* Form Styles */
                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 25px; }
                .form-group { display: flex; flex-direction: column; }
                .form-group.full-width { grid-column: 1 / -1; }
                .form-group label { font-weight: 600; margin-bottom: 8px; color: #0F1111; }
                .form-group input, .form-group select, .form-group textarea { padding: 10px 12px; border: 1px solid #D5D9D9; border-radius: 4px; font-size: 14px; }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #FF9900; box-shadow: 0 0 0 2px rgba(255, 153, 0, 0.2); }
                .form-group textarea { resize: vertical; min-height: 80px; }
                .form-group input:disabled { background: #F7F8F8; color: #565959; }
                
                .modal-actions { display: flex; justify-content: flex-end; gap: 15px; padding: 20px 25px; border-top: 1px solid #D5D9D9; }
                .btn-secondary { background: #FFFFFF; color: #0F1111; border: 1px solid #D5D9D9; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                .btn-secondary:hover { background: #F7F8F8; }
                
                /* Seller Details Styles */
                .seller-details { padding: 25px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .detail-item { display: flex; flex-direction: column; }
                .detail-item.full-width { grid-column: 1 / -1; }
                .detail-item label { font-weight: 600; color: #565959; font-size: 0.9em; margin-bottom: 5px; }
                .detail-item span { color: #0F1111; }
                
                /* Action Button Styles */
                .action-buttons { display: flex; flex-wrap: wrap; gap: 5px; }
                .verification-actions { display: flex; gap: 5px; margin-top: 5px; }
                .btn-danger { background: #C7511F; color: white; border: 1px solid #C7511F; }
                .btn-danger:hover { background: #B12704; }
                .btn-success { background: #067D62; color: white; border: 1px solid #067D62; }
                .btn-success:hover { background: #055A4A; }
                .btn-warning { background: #F08804; color: white; border: 1px solid #F08804; }
                .btn-warning:hover { background: #D67003; }
                
                /* Disabled button styles */
                .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-primary:disabled:hover, .btn-secondary:disabled:hover { background: initial; }
            `}</style>

            <h1>Seller Management</h1>
            <p className="subtitle">Manage all sellers and their stores on the platform</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalSellers.toLocaleString()}</div>
                    <div className="stat-label">Total Sellers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeSellers.toLocaleString()}</div>
                    <div className="stat-label">Active Sellers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.verifiedSellers.toLocaleString()}</div>
                    <div className="stat-label">Verified Sellers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingApproval}</div>
                    <div className="stat-label">Pending Approval</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.totalProducts.toLocaleString()}</div>
                    <div className="stat-label">Total Products</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">All Sellers</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search sellers..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <select value={filters.verificationStatus} onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}>
                        <option value="all">All Verification</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="btn-primary" onClick={openCreateModal}>Add Seller</button>
                    <button className="btn-primary" onClick={handleExportSellers}>Export</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Seller ID</th>
                            <th>Store Name</th>
                            <th>Email</th>
                            <th>Products</th>
                            <th>Revenue</th>
                            <th>Status</th>
                            <th>Verification</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellers.length > 0 ? sellers.map((seller) => (
                            <tr key={seller.id}>
                                <td>{seller.id.substring(0, 8)}...</td>
                                <td>{seller.name || seller.businessName || 'Unknown Store'}</td>
                                <td>{seller.email}</td>
                                <td>
                                    {seller.products || 0}
                                    {seller.approvedProducts !== undefined && (
                                        <span style={{color: '#067D62', fontSize: '0.8em'}}>
                                            {' '}({seller.approvedProducts} approved)
                                        </span>
                                    )}
                                </td>
                                <td>{formatCurrency(seller.revenue)}</td>
                                <td>
                                    <span className={`badge ${getStatusBadge(seller.status)}`}>
                                        {seller.status ? seller.status.charAt(0).toUpperCase() + seller.status.slice(1) : 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getVerificationBadge(seller.verificationStatus)}`}>
                                        {seller.verificationStatus ? seller.verificationStatus.charAt(0).toUpperCase() + seller.verificationStatus.slice(1) : 'Pending'}
                                    </span>
                                </td>
                                <td>{new Date(seller.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-sm" onClick={() => openViewModal(seller)}>View</button>
                                        <button className="btn-sm" onClick={() => openEditModal(seller)}>Edit</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDeleteSeller(seller)}>Delete</button>
                                        
                                        {seller.verificationStatus === 'pending' && (
                                            <div className="verification-actions">
                                                <button className="btn-sm btn-success" onClick={() => handleVerifySeller(seller, 'verified')}>Approve</button>
                                                <button className="btn-sm btn-warning" onClick={() => handleVerifySeller(seller, 'rejected')}>Reject</button>
                                            </div>
                                        )}
                                        
                                        {seller.status === 'active' && (
                                            <button className="btn-sm btn-warning" onClick={() => handleUpdateStatus(seller, 'suspended')}>Suspend</button>
                                        )}
                                        
                                        {seller.status === 'suspended' && (
                                            <button className="btn-sm btn-success" onClick={() => handleUpdateStatus(seller, 'active')}>Activate</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="9" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>🏪</div>
                                    <div>No sellers found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={!pagination.hasPrev}
                        >
                            Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={pagination.currentPage === page ? 'active' : ''}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        
                        <button 
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={!pagination.hasNext}
                        >
                            Next
                        </button>
                        
                        <span style={{marginLeft: '20px', color: '#565959'}}>
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                    </div>
                )}
            </div>

            {/* Create Seller Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Seller</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateSeller}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Name *</label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Email</label>
                                    <input
                                        type="email"
                                        value={formData.businessEmail}
                                        onChange={(e) => setFormData({...formData, businessEmail: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.businessPhone}
                                        onChange={(e) => setFormData({...formData, businessPhone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Business Address *</label>
                                    <textarea
                                        value={formData.businessAddress}
                                        onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Business Description</label>
                                    <textarea
                                        value={formData.businessDescription}
                                        onChange={(e) => setFormData({...formData, businessDescription: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tax ID</label>
                                    <input
                                        type="text"
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Seller Tier</label>
                                    <select
                                        value={formData.sellerTier}
                                        onChange={(e) => setFormData({...formData, sellerTier: e.target.value})}
                                    >
                                        <option value="bronze">Bronze</option>
                                        <option value="silver">Silver</option>
                                        <option value="gold">Gold</option>
                                        <option value="platinum">Platinum</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)} disabled={formLoading}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Creating...' : 'Create Seller'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Seller Modal */}
            {showEditModal && selectedSeller && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Seller: {selectedSeller.name}</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdateSeller}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Name</label>
                                    <input
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Email</label>
                                    <input
                                        type="email"
                                        value={formData.businessEmail}
                                        onChange={(e) => setFormData({...formData, businessEmail: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Business Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.businessPhone}
                                        onChange={(e) => setFormData({...formData, businessPhone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Business Address</label>
                                    <textarea
                                        value={formData.businessAddress}
                                        onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Business Description</label>
                                    <textarea
                                        value={formData.businessDescription}
                                        onChange={(e) => setFormData({...formData, businessDescription: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tax ID</label>
                                    <input
                                        type="text"
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Seller Tier</label>
                                    <select
                                        value={formData.sellerTier}
                                        onChange={(e) => setFormData({...formData, sellerTier: e.target.value})}
                                    >
                                        <option value="bronze">Bronze</option>
                                        <option value="silver">Silver</option>
                                        <option value="gold">Gold</option>
                                        <option value="platinum">Platinum</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)} disabled={formLoading}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Updating...' : 'Update Seller'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Seller Modal */}
            {showViewModal && selectedSeller && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Seller Details: {selectedSeller.name}</h3>
                            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
                        </div>
                        <div className="seller-details">
                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Seller ID:</label>
                                    <span>{selectedSeller.id}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email:</label>
                                    <span>{selectedSeller.email}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Display Name:</label>
                                    <span>{selectedSeller.displayName || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Business Name:</label>
                                    <span>{selectedSeller.businessName || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Business Email:</label>
                                    <span>{selectedSeller.businessEmail || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Business Phone:</label>
                                    <span>{selectedSeller.businessPhone || 'N/A'}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Business Address:</label>
                                    <span>{selectedSeller.businessAddress || 'N/A'}</span>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Business Description:</label>
                                    <span>{selectedSeller.businessDescription || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Tax ID:</label>
                                    <span>{selectedSeller.taxId || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone:</label>
                                    <span>{selectedSeller.phone || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status:</label>
                                    <span className={`badge ${getStatusBadge(selectedSeller.status)}`}>
                                        {selectedSeller.status ? selectedSeller.status.charAt(0).toUpperCase() + selectedSeller.status.slice(1) : 'Active'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Verification:</label>
                                    <span className={`badge ${getVerificationBadge(selectedSeller.verificationStatus)}`}>
                                        {selectedSeller.verificationStatus ? selectedSeller.verificationStatus.charAt(0).toUpperCase() + selectedSeller.verificationStatus.slice(1) : 'Pending'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Seller Tier:</label>
                                    <span>{selectedSeller.sellerTier ? selectedSeller.sellerTier.charAt(0).toUpperCase() + selectedSeller.sellerTier.slice(1) : 'Basic'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Products:</label>
                                    <span>{selectedSeller.products || 0} ({selectedSeller.approvedProducts || 0} approved)</span>
                                </div>
                                <div className="detail-item">
                                    <label>Revenue:</label>
                                    <span>{formatCurrency(selectedSeller.revenue)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Joined:</label>
                                    <span>{new Date(selectedSeller.joined).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                            <button className="btn-primary" onClick={() => {
                                setShowViewModal(false);
                                openEditModal(selectedSeller);
                            }}>Edit Seller</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSellersPage;
