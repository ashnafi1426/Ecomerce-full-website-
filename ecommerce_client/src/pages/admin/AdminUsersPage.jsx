import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';
import UserTable from '../../components/admin/UserTable';
import UserFilters from '../../components/admin/UserFilters';
import UserModal from '../../components/admin/UserModal';
import BulkActions from '../../components/admin/BulkActions';
import Pagination from '../../components/admin/Pagination';
import ExportModal from '../../components/admin/ExportModal';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        customers: 0,
        sellers: 0,
        managers: 0,
        admins: 0,
        activeToday: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        role: 'all',
        status: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        limit: 20,
        offset: 0,
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);

    // Debounced search
    const [searchTimeout, setSearchTimeout] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                ...filters,
                limit: pagination.limit,
                offset: pagination.offset
            };

            const response = await adminAPI.getUsers(params);
            
            if (response.success) {
                setUsers(response.users || []);
                setPagination(prev => ({
                    ...prev,
                    ...response.pagination,
                    totalCount: response.totalCount
                }));
                
                // Calculate stats from response
                setStats({
                    totalUsers: response.totalCount,
                    customers: response.users?.filter(u => u.role === 'customer').length || 0,
                    sellers: response.users?.filter(u => u.role === 'seller').length || 0,
                    managers: response.users?.filter(u => u.role === 'manager').length || 0,
                    admins: response.users?.filter(u => u.role === 'admin').length || 0,
                    activeToday: response.users?.filter(u => u.status === 'active').length || 0
                });
            } else {
                // Fallback for old API response format
                const usersData = response.users || response.data || [];
                setUsers(usersData);
                
                setStats({
                    totalUsers: usersData.length,
                    customers: usersData.filter(u => u.role === 'customer').length,
                    sellers: usersData.filter(u => u.role === 'seller').length,
                    managers: usersData.filter(u => u.role === 'manager').length,
                    admins: usersData.filter(u => u.role === 'admin').length,
                    activeToday: usersData.filter(u => u.status === 'active').length
                });
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            const errorMessage = error.message || 'Failed to load users';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit, pagination.offset]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle filter changes with debouncing for search
    const handleFilterChange = useCallback((key, value) => {
        if (key === 'search') {
            if (searchTimeout) clearTimeout(searchTimeout);
            setSearchTimeout(setTimeout(() => {
                setFilters(prev => ({ ...prev, [key]: value }));
                setPagination(prev => ({ ...prev, offset: 0, currentPage: 1 }));
            }, 500));
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
            setPagination(prev => ({ ...prev, offset: 0, currentPage: 1 }));
        }
    }, [searchTimeout]);

    // Handle pagination
    const handlePageChange = useCallback((page) => {
        const newOffset = (page - 1) * pagination.limit;
        setPagination(prev => ({
            ...prev,
            offset: newOffset,
            currentPage: page
        }));
    }, [pagination.limit]);

    // Handle page size change
    const handlePageSizeChange = useCallback((newSize) => {
        setPagination(prev => ({
            ...prev,
            limit: newSize,
            offset: 0,
            currentPage: 1
        }));
    }, []);

    // Handle user selection
    const handleUserSelect = useCallback((userId, selected) => {
        setSelectedUsers(prev => 
            selected 
                ? [...prev, userId]
                : prev.filter(id => id !== userId)
        );
    }, []);

    // Handle select all
    const handleSelectAll = useCallback((selected) => {
        setSelectedUsers(selected ? users.map(u => u.id) : []);
    }, [users]);

    // Handle user creation
    const handleCreateUser = useCallback(() => {
        setEditingUser(null);
        setShowUserModal(true);
    }, []);

    // Handle user editing
    const handleEditUser = useCallback((user) => {
        setEditingUser(user);
        setShowUserModal(true);
    }, []);

    // Handle user deletion
    const handleDeleteUser = useCallback(async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await adminAPI.deleteUser(userId);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to delete user');
        }
    }, [fetchUsers]);

    // Handle user save (create/update)
    const handleUserSave = useCallback(async (userData) => {
        try {
            if (editingUser) {
                await adminAPI.updateUser(editingUser.id, userData);
                toast.success('User updated successfully');
            } else {
                await adminAPI.createUser(userData);
                toast.success('User created successfully');
            }
            setShowUserModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to save user');
        }
    }, [editingUser, fetchUsers]);

    // Handle bulk actions
    const handleBulkAction = useCallback(async (action, data) => {
        if (selectedUsers.length === 0) {
            toast.warning('Please select users first');
            return;
        }

        setBulkLoading(true);
        try {
            await adminAPI.bulkUpdateUsers({
                userIds: selectedUsers,
                updates: data
            });
            toast.success(`Bulk ${action} completed successfully`);
            setSelectedUsers([]);
            fetchUsers();
        } catch (error) {
            toast.error(error.message || `Failed to perform bulk ${action}`);
        } finally {
            setBulkLoading(false);
        }
    }, [selectedUsers, fetchUsers]);

    // Handle export
    const handleExport = useCallback(async (format) => {
        try {
            const params = { ...filters, format };
            const response = await adminAPI.exportUsers(params);
            
            // Create download link
            const blob = new Blob([response], { 
                type: format === 'csv' ? 'text/csv' : 'application/json' 
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users-export-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Export completed successfully');
            setShowExportModal(false);
        } catch (error) {
            toast.error(error.message || 'Failed to export users');
        }
    }, [filters]);

    if (loading && users.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading users...</div>
            </div>
        );
    }

    if (error && users.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchUsers} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-users-page-enhanced">
            <style>{`
                .admin-users-page-enhanced {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .page-header {
                    margin-bottom: 30px;
                }
                
                .page-title {
                    font-size: 2.2em;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #0F1111;
                }
                
                .page-subtitle {
                    color: #565959;
                    font-size: 1.1em;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: #FFFFFF;
                    padding: 24px;
                    border-radius: 8px;
                    border: 1px solid #D5D9D9;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: transform 0.2s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                
                .stat-value {
                    font-size: 2.8em;
                    font-weight: bold;
                    color: #FF9900;
                    margin-bottom: 8px;
                }
                
                .stat-label {
                    font-size: 0.95em;
                    color: #565959;
                    font-weight: 500;
                }
                
                .main-content {
                    background: #FFFFFF;
                    border-radius: 8px;
                    border: 1px solid #D5D9D9;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .content-header {
                    padding: 24px;
                    border-bottom: 1px solid #D5D9D9;
                    background: #F7F8F8;
                }
                
                .content-title {
                    font-size: 1.4em;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: #0F1111;
                }
                
                .actions-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                
                .primary-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .btn-primary {
                    background: #FF9900;
                    color: #FFFFFF;
                }
                
                .btn-primary:hover {
                    background: #E88B00;
                    transform: translateY(-1px);
                }
                
                .btn-secondary {
                    background: #FFFFFF;
                    color: #0F1111;
                    border: 1px solid #D5D9D9;
                }
                
                .btn-secondary:hover {
                    background: #F7F8F8;
                    border-color: #B7B7B7;
                }
                
                .content-body {
                    padding: 0;
                }
                
                .loading-overlay {
                    position: relative;
                }
                
                .loading-overlay::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }
                
                @media (max-width: 768px) {
                    .admin-users-page-enhanced {
                        padding: 16px;
                    }
                    
                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 16px;
                    }
                    
                    .stat-card {
                        padding: 16px;
                    }
                    
                    .stat-value {
                        font-size: 2.2em;
                    }
                    
                    .actions-bar {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .primary-actions {
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="page-header">
                <h1 className="page-title">User Management</h1>
                <p className="page-subtitle">
                    Manage all platform users with advanced search, filtering, and bulk operations
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.customers.toLocaleString()}</div>
                    <div className="stat-label">Customers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.sellers.toLocaleString()}</div>
                    <div className="stat-label">Sellers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.managers.toLocaleString()}</div>
                    <div className="stat-label">Managers</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.admins.toLocaleString()}</div>
                    <div className="stat-label">Admins</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats.activeToday.toLocaleString()}</div>
                    <div className="stat-label">Active Users</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="content-header">
                    <h2 className="content-title">All Users</h2>
                    <div className="actions-bar">
                        <div className="primary-actions">
                            <button 
                                className="btn btn-primary"
                                onClick={handleCreateUser}
                            >
                                ➕ Add User
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowExportModal(true)}
                            >
                                📊 Export
                            </button>
                        </div>
                        
                        {selectedUsers.length > 0 && (
                            <BulkActions
                                selectedCount={selectedUsers.length}
                                onBulkAction={handleBulkAction}
                                loading={bulkLoading}
                            />
                        )}
                    </div>
                </div>

                <div className="content-body">
                    <UserFilters
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        loading={loading}
                    />
                    
                    <div className={loading ? 'loading-overlay' : ''}>
                        <UserTable
                            users={users}
                            selectedUsers={selectedUsers}
                            onUserSelect={handleUserSelect}
                            onSelectAll={handleSelectAll}
                            onEditUser={handleEditUser}
                            onDeleteUser={handleDeleteUser}
                            loading={loading}
                        />
                    </div>
                    
                    <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </div>
            </div>

            {/* Modals */}
            {showUserModal && (
                <UserModal
                    user={editingUser}
                    onSave={handleUserSave}
                    onClose={() => {
                        setShowUserModal(false);
                        setEditingUser(null);
                    }}
                />
            )}

            {showExportModal && (
                <ExportModal
                    onExport={handleExport}
                    onClose={() => setShowExportModal(false)}
                    filters={filters}
                />
            )}
        </div>
    );
};

export default AdminUsersPage;
