import { useState } from 'react';

const UserTable = ({ 
    users, 
    selectedUsers, 
    onUserSelect, 
    onSelectAll, 
    onEditUser, 
    onDeleteUser,
    loading 
}) => {
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getStatusBadge = (status) => {
        const statusLower = status?.toLowerCase();
        const badges = {
            active: { class: 'badge-active', text: 'Active' },
            suspended: { class: 'badge-suspended', text: 'Suspended' },
            blocked: { class: 'badge-blocked', text: 'Blocked' },
            deleted: { class: 'badge-deleted', text: 'Deleted' },
            pending: { class: 'badge-pending', text: 'Pending' }
        };
        return badges[statusLower] || badges.pending;
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { class: 'role-admin', text: 'Admin' },
            manager: { class: 'role-manager', text: 'Manager' },
            seller: { class: 'role-seller', text: 'Seller' },
            customer: { class: 'role-customer', text: 'Customer' }
        };
        return badges[role] || badges.customer;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
    const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length;

    return (
        <div className="user-table-container">
            <style>{`
                .user-table-container {
                    overflow-x: auto;
                }
                
                .user-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9em;
                }
                
                .user-table th {
                    background: #F7F8F8;
                    padding: 16px 12px;
                    text-align: left;
                    font-weight: 600;
                    color: #0F1111;
                    border-bottom: 2px solid #D5D9D9;
                    white-space: nowrap;
                    cursor: pointer;
                    user-select: none;
                    position: relative;
                }
                
                .user-table th:hover {
                    background: #EAEDED;
                }
                
                .user-table th.sortable::after {
                    content: '↕️';
                    margin-left: 8px;
                    opacity: 0.5;
                }
                
                .user-table th.sorted-asc::after {
                    content: '↑';
                    opacity: 1;
                }
                
                .user-table th.sorted-desc::after {
                    content: '↓';
                    opacity: 1;
                }
                
                .user-table td {
                    padding: 16px 12px;
                    border-bottom: 1px solid #D5D9D9;
                    vertical-align: middle;
                }
                
                .user-table tr:hover {
                    background: #F7F8F8;
                }
                
                .user-table tr.selected {
                    background: #FFF4E5;
                }
                
                .checkbox-cell {
                    width: 40px;
                    text-align: center;
                }
                
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #FF9900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 1.2em;
                }
                
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .user-details h4 {
                    margin: 0 0 4px 0;
                    font-weight: 600;
                    color: #0F1111;
                }
                
                .user-details p {
                    margin: 0;
                    color: #565959;
                    font-size: 0.9em;
                }
                
                .badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8em;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .badge-active {
                    background: #E6F4F1;
                    color: #067D62;
                }
                
                .badge-suspended {
                    background: #FFF4E5;
                    color: #F08804;
                }
                
                .badge-blocked {
                    background: #FFE5E5;
                    color: #C7511F;
                }
                
                .badge-deleted {
                    background: #F0F0F0;
                    color: #666666;
                }
                
                .badge-pending {
                    background: #E3F2FD;
                    color: #1976D2;
                }
                
                .role-badge {
                    display: inline-block;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .role-admin {
                    background: #FFE5E5;
                    color: #C7511F;
                }
                
                .role-manager {
                    background: #E3F2FD;
                    color: #1976D2;
                }
                
                .role-seller {
                    background: #E8F5E8;
                    color: #2E7D32;
                }
                
                .role-customer {
                    background: #F3E5F5;
                    color: #7B1FA2;
                }
                
                .actions-cell {
                    white-space: nowrap;
                }
                
                .btn-action {
                    padding: 6px 12px;
                    margin: 0 2px;
                    border: 1px solid #D5D9D9;
                    background: #FFFFFF;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8em;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .btn-action:hover {
                    background: #F7F8F8;
                    border-color: #B7B7B7;
                }
                
                .btn-view {
                    color: #0066CC;
                }
                
                .btn-edit {
                    color: #FF9900;
                }
                
                .btn-delete {
                    color: #C7511F;
                }
                
                .btn-delete:hover {
                    background: #FFE5E5;
                    border-color: #C7511F;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #565959;
                }
                
                .empty-state-icon {
                    font-size: 3em;
                    margin-bottom: 16px;
                }
                
                .loading-row td {
                    text-align: center;
                    padding: 40px;
                    color: #565959;
                }
                
                @media (max-width: 768px) {
                    .user-table {
                        font-size: 0.8em;
                    }
                    
                    .user-table th,
                    .user-table td {
                        padding: 12px 8px;
                    }
                    
                    .user-avatar {
                        width: 32px;
                        height: 32px;
                        font-size: 1em;
                    }
                    
                    .actions-cell {
                        min-width: 120px;
                    }
                }
            `}</style>

            <table className="user-table">
                <thead>
                    <tr>
                        <th className="checkbox-cell">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                ref={input => {
                                    if (input) input.indeterminate = isIndeterminate;
                                }}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </th>
                        <th 
                            className={`sortable ${sortField === 'display_name' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('display_name')}
                        >
                            User
                        </th>
                        <th 
                            className={`sortable ${sortField === 'role' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('role')}
                        >
                            Role
                        </th>
                        <th 
                            className={`sortable ${sortField === 'status' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('status')}
                        >
                            Status
                        </th>
                        <th 
                            className={`sortable ${sortField === 'created_at' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('created_at')}
                        >
                            Joined
                        </th>
                        <th 
                            className={`sortable ${sortField === 'last_login_at' ? `sorted-${sortDirection}` : ''}`}
                            onClick={() => handleSort('last_login_at')}
                        >
                            Last Login
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && users.length === 0 ? (
                        <tr className="loading-row">
                            <td colSpan="7">
                                <div>⏳ Loading users...</div>
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan="7">
                                <div className="empty-state">
                                    <div className="empty-state-icon">👥</div>
                                    <div>No users found</div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => {
                            const statusBadge = getStatusBadge(user.status);
                            const roleBadge = getRoleBadge(user.role);
                            const isSelected = selectedUsers.includes(user.id);
                            
                            return (
                                <tr 
                                    key={user.id} 
                                    className={isSelected ? 'selected' : ''}
                                >
                                    <td className="checkbox-cell">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => onUserSelect(user.id, e.target.checked)}
                                        />
                                    </td>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {(user.display_name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="user-details">
                                                <h4>{user.display_name || 'No Name'}</h4>
                                                <p>{user.email}</p>
                                                {user.phone && <p>📞 {user.phone}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${roleBadge.class}`}>
                                            {roleBadge.text}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${statusBadge.class}`}>
                                            {statusBadge.text}
                                        </span>
                                    </td>
                                    <td>{formatDate(user.created_at)}</td>
                                    <td>{formatDate(user.last_login_at)}</td>
                                    <td className="actions-cell">
                                        <button 
                                            className="btn-action btn-view"
                                            onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                                            title="View Details"
                                        >
                                            👁️ View
                                        </button>
                                        <button 
                                            className="btn-action btn-edit"
                                            onClick={() => onEditUser(user)}
                                            title="Edit User"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button 
                                            className="btn-action btn-delete"
                                            onClick={() => onDeleteUser(user.id)}
                                            title="Delete User"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;