import { useState } from 'react';

const BulkActions = ({ selectedCount, onBulkAction, loading }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    const handleStatusUpdate = (status) => {
        onBulkAction('status update', { status });
        setShowStatusModal(false);
        setShowDropdown(false);
    };

    const handleRoleUpdate = (role) => {
        onBulkAction('role update', { role });
        setShowRoleModal(false);
        setShowDropdown(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedCount} selected users? This action cannot be undone.`)) {
            onBulkAction('delete', { status: 'deleted' });
            setShowDropdown(false);
        }
    };

    return (
        <div className="bulk-actions">
            <style>{`
                .bulk-actions {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .selected-count {
                    background: #FF9900;
                    color: #FFFFFF;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 0.9em;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .bulk-dropdown {
                    position: relative;
                }
                
                .bulk-trigger {
                    background: #FFFFFF;
                    border: 2px solid #FF9900;
                    color: #FF9900;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.9em;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                
                .bulk-trigger:hover {
                    background: #FF9900;
                    color: #FFFFFF;
                }
                
                .bulk-trigger:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .bulk-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: #FFFFFF;
                    border: 1px solid #D5D9D9;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    z-index: 100;
                    min-width: 200px;
                    margin-top: 4px;
                }
                
                .bulk-menu-item {
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #F0F0F0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.9em;
                    transition: background-color 0.2s ease;
                }
                
                .bulk-menu-item:hover {
                    background: #F7F8F8;
                }
                
                .bulk-menu-item:last-child {
                    border-bottom: none;
                }
                
                .bulk-menu-item.danger {
                    color: #C7511F;
                }
                
                .bulk-menu-item.danger:hover {
                    background: #FFE5E5;
                }
                
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background: #FFFFFF;
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .modal-title {
                    font-size: 1.3em;
                    font-weight: 600;
                    margin-bottom: 16px;
                    color: #0F1111;
                }
                
                .modal-description {
                    color: #565959;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }
                
                .status-options,
                .role-options {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .option-btn {
                    padding: 12px 16px;
                    border: 2px solid #D5D9D9;
                    background: #FFFFFF;
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: center;
                    font-size: 0.9em;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }
                
                .option-btn:hover {
                    border-color: #FF9900;
                    background: #FFF4E5;
                }
                
                .option-btn.active {
                    border-color: #FF9900;
                    background: #FF9900;
                    color: #FFFFFF;
                }
                
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                
                .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    font-size: 0.9em;
                    transition: all 0.2s ease;
                }
                
                .btn-secondary {
                    background: #FFFFFF;
                    color: #0F1111;
                    border: 2px solid #D5D9D9;
                }
                
                .btn-secondary:hover {
                    background: #F7F8F8;
                }
                
                .btn-primary {
                    background: #FF9900;
                    color: #FFFFFF;
                }
                
                .btn-primary:hover {
                    background: #E88B00;
                }
                
                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid transparent;
                    border-top: 2px solid currentColor;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 768px) {
                    .bulk-actions {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }
                    
                    .bulk-menu {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        right: auto;
                        width: 90%;
                        max-width: 300px;
                    }
                    
                    .status-options,
                    .role-options {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <div className="selected-count">
                ✓ {selectedCount} selected
            </div>

            <div className="bulk-dropdown">
                <button
                    className="bulk-trigger"
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={loading}
                >
                    {loading && <div className="loading-spinner"></div>}
                    Bulk Actions ▼
                </button>

                {showDropdown && (
                    <div className="bulk-menu">
                        <div 
                            className="bulk-menu-item"
                            onClick={() => setShowStatusModal(true)}
                        >
                            🔄 Change Status
                        </div>
                        <div 
                            className="bulk-menu-item"
                            onClick={() => setShowRoleModal(true)}
                        >
                            👤 Change Role
                        </div>
                        <div 
                            className="bulk-menu-item danger"
                            onClick={handleDelete}
                        >
                            🗑️ Delete Users
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Update User Status</h3>
                        <p className="modal-description">
                            Select the new status for {selectedCount} selected users:
                        </p>
                        
                        <div className="status-options">
                            <button 
                                className="option-btn"
                                onClick={() => handleStatusUpdate('active')}
                            >
                                <span>✅</span>
                                <span>Active</span>
                            </button>
                            <button 
                                className="option-btn"
                                onClick={() => handleStatusUpdate('suspended')}
                            >
                                <span>⏸️</span>
                                <span>Suspended</span>
                            </button>
                            <button 
                                className="option-btn"
                                onClick={() => handleStatusUpdate('blocked')}
                            >
                                <span>🚫</span>
                                <span>Blocked</span>
                            </button>
                            <button 
                                className="option-btn"
                                onClick={() => handleStatusUpdate('pending')}
                            >
                                <span>⏳</span>
                                <span>Pending</span>
                            </button>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowStatusModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Update Modal */}
            {showRoleModal && (
                <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Update User Role</h3>
                        <p className="modal-description">
                            Select the new role for {selectedCount} selected users:
                        </p>
                        
                        <div className="role-options">
                            <button 
                                className="option-btn"
                                onClick={() => handleRoleUpdate('customer')}
                            >
                                <span>🛍️</span>
                                <span>Customer</span>
                            </button>
                            <button 
                                className="option-btn"
                                onClick={() => handleRoleUpdate('seller')}
                            >
                                <span>🏪</span>
                                <span>Seller</span>
                            </button>
                            <button 
                                className="option-btn"
                                onClick={() => handleRoleUpdate('manager')}
                            >
                                <span>👔</span>
                                <span>Manager</span>
                            </button>
                            <button 
                                className="option-btn"
                                onClick={() => handleRoleUpdate('admin')}
                            >
                                <span>⚡</span>
                                <span>Admin</span>
                            </button>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowRoleModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 50
                    }}
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
};

export default BulkActions;