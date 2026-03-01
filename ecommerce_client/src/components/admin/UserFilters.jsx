import { useState } from 'react';

const UserFilters = ({ filters, onFilterChange, loading }) => {
    const [searchValue, setSearchValue] = useState(filters.search);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        onFilterChange('search', value);
    };

    const clearFilters = () => {
        setSearchValue('');
        onFilterChange('search', '');
        onFilterChange('role', 'all');
        onFilterChange('status', 'all');
        onFilterChange('sortBy', 'created_at');
        onFilterChange('sortOrder', 'desc');
    };

    const hasActiveFilters = filters.search || filters.role !== 'all' || filters.status !== 'all';

    return (
        <div className="user-filters">
            <style>{`
                .user-filters {
                    padding: 24px;
                    background: #FAFAFA;
                    border-bottom: 1px solid #D5D9D9;
                }
                
                .filters-row {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-bottom: 16px;
                }
                
                .search-container {
                    flex: 1;
                    min-width: 300px;
                    position: relative;
                }
                
                .search-input {
                    width: 100%;
                    padding: 12px 16px 12px 44px;
                    border: 2px solid #D5D9D9;
                    border-radius: 8px;
                    font-size: 1em;
                    transition: border-color 0.2s ease;
                    background: #FFFFFF;
                }
                
                .search-input:focus {
                    outline: none;
                    border-color: #FF9900;
                    box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
                }
                
                .search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #565959;
                    font-size: 1.2em;
                }
                
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .filter-label {
                    font-size: 0.85em;
                    font-weight: 600;
                    color: #0F1111;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .filter-select {
                    padding: 10px 12px;
                    border: 2px solid #D5D9D9;
                    border-radius: 6px;
                    font-size: 0.9em;
                    background: #FFFFFF;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                    min-width: 120px;
                }
                
                .filter-select:focus {
                    outline: none;
                    border-color: #FF9900;
                }
                
                .sort-group {
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                }
                
                .sort-select {
                    padding: 10px 12px;
                    border: 2px solid #D5D9D9;
                    border-radius: 6px;
                    font-size: 0.9em;
                    background: #FFFFFF;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                }
                
                .sort-select:focus {
                    outline: none;
                    border-color: #FF9900;
                }
                
                .filter-actions {
                    display: flex;
                    gap: 12px;
                    align-items: flex-end;
                }
                
                .btn-clear {
                    padding: 10px 16px;
                    background: #FFFFFF;
                    border: 2px solid #D5D9D9;
                    border-radius: 6px;
                    color: #565959;
                    cursor: pointer;
                    font-size: 0.9em;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .btn-clear:hover {
                    background: #F7F8F8;
                    border-color: #B7B7B7;
                    color: #0F1111;
                }
                
                .btn-clear:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .active-filters {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .filter-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 12px;
                    background: #FF9900;
                    color: #FFFFFF;
                    border-radius: 16px;
                    font-size: 0.8em;
                    font-weight: 500;
                }
                
                .filter-tag-remove {
                    background: none;
                    border: none;
                    color: #FFFFFF;
                    cursor: pointer;
                    padding: 0;
                    font-size: 1.1em;
                    line-height: 1;
                }
                
                .loading-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    color: #565959;
                    font-size: 0.9em;
                }
                
                .loading-spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #D5D9D9;
                    border-top: 2px solid #FF9900;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @media (max-width: 768px) {
                    .user-filters {
                        padding: 16px;
                    }
                    
                    .filters-row {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }
                    
                    .search-container {
                        min-width: auto;
                    }
                    
                    .sort-group {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 8px;
                    }
                    
                    .filter-actions {
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="filters-row">
                <div className="search-container">
                    <div className="search-icon">🔍</div>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, email, or phone..."
                        value={searchValue}
                        onChange={handleSearchChange}
                        disabled={loading}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-label">Role</label>
                    <select
                        className="filter-select"
                        value={filters.role}
                        onChange={(e) => onFilterChange('role', e.target.value)}
                        disabled={loading}
                    >
                        <option value="all">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => onFilterChange('status', e.target.value)}
                        disabled={loading}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                        <option value="deleted">Deleted</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                <div className="sort-group">
                    <div className="filter-group">
                        <label className="filter-label">Sort By</label>
                        <select
                            className="sort-select"
                            value={filters.sortBy}
                            onChange={(e) => onFilterChange('sortBy', e.target.value)}
                            disabled={loading}
                        >
                            <option value="created_at">Join Date</option>
                            <option value="display_name">Name</option>
                            <option value="email">Email</option>
                            <option value="last_login_at">Last Login</option>
                            <option value="role">Role</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                    
                    <div className="filter-group">
                        <label className="filter-label">Order</label>
                        <select
                            className="sort-select"
                            value={filters.sortOrder}
                            onChange={(e) => onFilterChange('sortOrder', e.target.value)}
                            disabled={loading}
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                </div>

                <div className="filter-actions">
                    <button
                        className="btn-clear"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters || loading}
                    >
                        🔄 Clear Filters
                    </button>
                    
                    {loading && (
                        <div className="loading-indicator">
                            <div className="loading-spinner"></div>
                            <span>Filtering...</span>
                        </div>
                    )}
                </div>
            </div>

            {hasActiveFilters && (
                <div className="active-filters">
                    <span style={{ color: '#565959', fontSize: '0.9em', fontWeight: '500' }}>
                        Active filters:
                    </span>
                    
                    {filters.search && (
                        <div className="filter-tag">
                            Search: "{filters.search}"
                            <button
                                className="filter-tag-remove"
                                onClick={() => {
                                    setSearchValue('');
                                    onFilterChange('search', '');
                                }}
                            >
                                ×
                            </button>
                        </div>
                    )}
                    
                    {filters.role !== 'all' && (
                        <div className="filter-tag">
                            Role: {filters.role}
                            <button
                                className="filter-tag-remove"
                                onClick={() => onFilterChange('role', 'all')}
                            >
                                ×
                            </button>
                        </div>
                    )}
                    
                    {filters.status !== 'all' && (
                        <div className="filter-tag">
                            Status: {filters.status}
                            <button
                                className="filter-tag-remove"
                                onClick={() => onFilterChange('status', 'all')}
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserFilters;