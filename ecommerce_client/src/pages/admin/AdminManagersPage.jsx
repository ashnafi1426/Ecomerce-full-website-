import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminManagersPage = () => {
    const [managers, setManagers] = useState([]);
    const [stats, setStats] = useState({
        totalManagers: 0,
        activeManagers: 0,
        pendingApproval: 0,
        suspendedManagers: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        department: 'all'
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
    const [selectedManager, setSelectedManager] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        displayName: '',
        phone: '',
        department: '',
        permissions: []
    });

    useEffect(() => {
        fetchManagers();
    }, [filters, pagination.limit, pagination.offset]);

    const fetchManagers = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                search: filters.search || undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
                department: filters.department !== 'all' ? filters.department : undefined,
                limit: pagination.limit,
                offset: pagination.offset
            };
            
            console.log('🔍 Fetching managers with params:', params);
            const response = await adminAPI.getManagers(params);
            console.log('✅ Managers response:', response);
            
            // Handle response data structure
            const apiResponse = response.data || response;
            const managersData = apiResponse.managers || apiResponse.data || [];
            setManagers(managersData);
            
            // Update stats from response
            if (apiResponse.stats) {
                setStats(apiResponse.stats);
            } else {
                // Calculate stats from data if not provided
                setStats({
                    totalManagers: apiResponse.totalCount || managersData.length,
                    activeManagers: managersData.filter(m => m.status === 'active').length,
                    pendingApproval: 0, // No pending status in this system
                    suspendedManagers: managersData.filter(m => m.status === 'blocked' || m.status === 'deleted').length
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
            console.error('Error fetching managers:', error);
            const errorMessage = error.message || 'Failed to load managers';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateManager = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            // Validate required fields
            if (!formData.email || !formData.password || !formData.displayName) {
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
            
            await adminAPI.createManager(formData);
            toast.success('Manager created successfully');
            setShowCreateModal(false);
            resetForm();
            fetchManagers();
        } catch (error) {
            console.error('Create manager error:', error);
            toast.error(error.message || 'Failed to create manager');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateManager = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            // Validate required fields (excluding password for updates)
            if (!formData.displayName) {
                toast.error('Display name is required');
                return;
            }
            
            // Remove empty password field for updates
            const updateData = { ...formData };
            if (!updateData.password) {
                delete updateData.password;
            }
            
            await adminAPI.updateManager(selectedManager.id, updateData);
            toast.success('Manager updated successfully');
            setShowEditModal(false);
            resetForm();
            fetchManagers();
        } catch (error) {
            console.error('Update manager error:', error);
            toast.error(error.message || 'Failed to update manager');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteManager = async (manager) => {
        const confirmMessage = `Are you sure you want to delete manager "${manager.display_name || manager.displayName}"?\n\nThis action cannot be undone and will:\n• Remove the manager account\n• Revoke all permissions\n• Transfer responsibilities to admin\n\nType "DELETE" to confirm:`;
        
        const confirmation = window.prompt(confirmMessage);
        
        if (confirmation === 'DELETE') {
            try {
                await adminAPI.deleteManager(manager.id);
                toast.success('Manager deleted successfully');
                fetchManagers();
            } catch (error) {
                toast.error(error.message || 'Failed to delete manager');
            }
        } else if (confirmation !== null) {
            toast.error('Deletion cancelled - confirmation text did not match');
        }
    };

    const handleUpdateStatus = async (manager, newStatus) => {
        try {
            await adminAPI.updateManagerStatus(manager.id, { status: newStatus });
            toast.success(`Manager status updated to ${newStatus}`);
            fetchManagers();
        } catch (error) {
            toast.error(error.message || 'Failed to update manager status');
        }
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const openEditModal = (manager) => {
        setSelectedManager(manager);
        setFormData({
            email: manager.email || '',
            password: '', // Don't populate password for security
            displayName: manager.display_name || manager.displayName || '',
            phone: manager.phone || '',
            department: manager.manager_department || manager.department || '',
            permissions: manager.manager_permissions || manager.permissions || []
        });
        setShowEditModal(true);
    };

    const openViewModal = (manager) => {
        setSelectedManager(manager);
        setShowViewModal(true);
    };

    const handleExportManagers = async () => {
        try {
            const exportData = managers.map(manager => ({
                'Manager ID': manager.id,
                'Name': manager.display_name || manager.displayName || 'N/A',
                'Email': manager.email,
                'Phone': manager.phone || '',
                'Department': manager.manager_department || manager.department || '',
                'Permissions': Array.isArray(manager.manager_permissions) ? manager.manager_permissions.join(', ') : Array.isArray(manager.permissions) ? manager.permissions.join(', ') : '',
                'Status': manager.status || 'active',
                'Created Date': new Date(manager.created_at).toLocaleDateString()
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
            link.setAttribute('download', `managers-export-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Managers data exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export managers data');
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            displayName: '',
            phone: '',
            department: '',
            permissions: []
        });
        setSelectedManager(null);
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        if (statusLower === 'active') return 'badge-active';
        if (statusLower === 'blocked') return 'badge-suspended';
        if (statusLower === 'deleted') return 'badge-suspended';
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

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading managers...</div>
            </div>
        );
    }

    if (error && managers.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchManagers} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-managers-page">
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
                
                .permissions-list { display: flex; flex-wrap: wrap; gap: 5px; }
                .permission-tag { padding: 3px 8px; background: #E7F3FF; color: #146EB4; border-radius: 4px; font-size: 0.75em; }
                
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
                
                /* Manager Details Styles */
                .manager-details { padding: 25px; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .detail-item { display: flex; flex-direction: column; }
                .detail-item.full-width { grid-column: 1 / -1; }
                .detail-item label { font-weight: 600; color: #565959; font-size: 0.9em; margin-bottom: 5px; }
                .detail-item span { color: #0F1111; }
                
                /* Action Button Styles */
                .action-buttons { display: flex; flex-wrap: wrap; gap: 5px; }
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

            <h1>Manager Management</h1>
            <p className="subtitle">Manage platform managers and their permissions</p>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalManagers.toLocaleString()}</div>
                    <div className="stat-label">Total Managers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeManagers.toLocaleString()}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.pendingApproval}</div>
                    <div className="stat-label">Pending Approval</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.suspendedManagers}</div>
                    <div className="stat-label">Blocked/Deleted</div>
                </div>
            </div>

            <div className="section">
                <h2 className="section-title">All Managers</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search managers..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="deleted">Deleted</option>
                    </select>
                    <select value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
                        <option value="all">All Departments</option>
                        <option value="product">Product Management</option>
                        <option value="customer">Customer Service</option>
                        <option value="operations">Operations</option>
                        <option value="sales">Sales</option>
                        <option value="marketing">Marketing</option>
                    </select>
                    <button className="btn-primary" onClick={openCreateModal}>Add Manager</button>
                    <button className="btn-primary" onClick={handleExportManagers}>Export</button>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Manager ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Phone</th>
                            <th>Permissions</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {managers.length > 0 ? managers.map((manager) => (
                            <tr key={manager.id}>
                                <td>{manager.id.substring(0, 8)}...</td>
                                <td>{manager.display_name || manager.displayName || 'N/A'}</td>
                                <td>{manager.email}</td>
                                <td>{manager.manager_department || manager.department || 'N/A'}</td>
                                <td>{manager.phone || 'N/A'}</td>
                                <td>
                                    <div className="permissions-list">
                                        {manager.manager_permissions && Array.isArray(manager.manager_permissions) && manager.manager_permissions.length > 0 ? (
                                            <>
                                                {manager.manager_permissions.slice(0, 2).map((perm, idx) => (
                                                    <span key={idx} className="permission-tag">
                                                        {perm.replace('_', ' ')}
                                                    </span>
                                                ))}
                                                {manager.manager_permissions.length > 2 && (
                                                    <span className="permission-tag">
                                                        +{manager.manager_permissions.length - 2} more
                                                    </span>
                                                )}
                                            </>
                                        ) : manager.permissions && Array.isArray(manager.permissions) && manager.permissions.length > 0 ? (
                                            <>
                                                {manager.permissions.slice(0, 2).map((perm, idx) => (
                                                    <span key={idx} className="permission-tag">
                                                        {perm.replace('_', ' ')}
                                                    </span>
                                                ))}
                                                {manager.permissions.length > 2 && (
                                                    <span className="permission-tag">
                                                        +{manager.permissions.length - 2} more
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="permission-tag">No permissions</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusBadge(manager.status)}`}>
                                        {(manager.status || 'active').charAt(0).toUpperCase() + (manager.status || 'active').slice(1)}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button className="btn-sm" onClick={() => openViewModal(manager)}>View</button>
                                        <button className="btn-sm" onClick={() => openEditModal(manager)}>Edit</button>
                                        <button className="btn-sm btn-danger" onClick={() => handleDeleteManager(manager)}>Delete</button>
                                        
                                        {manager.status === 'active' && (
                                            <button className="btn-sm btn-warning" onClick={() => handleUpdateStatus(manager, 'blocked')}>Block</button>
                                        )}
                                        
                                        {(manager.status === 'blocked' || manager.status === 'deleted') && (
                                            <button className="btn-sm btn-success" onClick={() => handleUpdateStatus(manager, 'active')}>Activate</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>👔</div>
                                    <div>No managers found</div>
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

            {/* Create Manager Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Manager</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateManager}>
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
                                    <label>Display Name *</label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                                        required
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
                                    <label>Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="product">Product Management</option>
                                        <option value="customer">Customer Service</option>
                                        <option value="operations">Operations</option>
                                        <option value="sales">Sales</option>
                                        <option value="marketing">Marketing</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)} disabled={formLoading}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Creating...' : 'Create Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Manager Modal */}
            {showEditModal && selectedManager && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Manager: {selectedManager.display_name || selectedManager.displayName}</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleUpdateManager}>
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
                                    <label>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="product">Product Management</option>
                                        <option value="customer">Customer Service</option>
                                        <option value="operations">Operations</option>
                                        <option value="sales">Sales</option>
                                        <option value="marketing">Marketing</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)} disabled={formLoading}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Updating...' : 'Update Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Manager Modal */}
            {showViewModal && selectedManager && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Manager Details: {selectedManager.display_name || selectedManager.displayName}</h3>
                            <button className="modal-close" onClick={() => setShowViewModal(false)}>×</button>
                        </div>
                        <div className="manager-details">
                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Manager ID:</label>
                                    <span>{selectedManager.id}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email:</label>
                                    <span>{selectedManager.email}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Display Name:</label>
                                    <span>{selectedManager.display_name || selectedManager.displayName || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone:</label>
                                    <span>{selectedManager.phone || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Department:</label>
                                    <span>{selectedManager.manager_department || selectedManager.department || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status:</label>
                                    <span className={`badge ${getStatusBadge(selectedManager.status)}`}>
                                        {(selectedManager.status || 'active').charAt(0).toUpperCase() + (selectedManager.status || 'active').slice(1)}
                                    </span>
                                </div>
                                <div className="detail-item full-width">
                                    <label>Permissions:</label>
                                    <div className="permissions-list">
                                        {selectedManager.manager_permissions && Array.isArray(selectedManager.manager_permissions) && selectedManager.manager_permissions.length > 0 ? (
                                            selectedManager.manager_permissions.map((perm, idx) => (
                                                <span key={idx} className="permission-tag">
                                                    {perm.replace('_', ' ')}
                                                </span>
                                            ))
                                        ) : selectedManager.permissions && Array.isArray(selectedManager.permissions) && selectedManager.permissions.length > 0 ? (
                                            selectedManager.permissions.map((perm, idx) => (
                                                <span key={idx} className="permission-tag">
                                                    {perm.replace('_', ' ')}
                                                </span>
                                            ))
                                        ) : (
                                            <span>No permissions assigned</span>
                                        )}
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <label>Created:</label>
                                    <span>{new Date(selectedManager.created_at).toLocaleDateString('en-US', { 
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
                                openEditModal(selectedManager);
                            }}>Edit Manager</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagersPage;