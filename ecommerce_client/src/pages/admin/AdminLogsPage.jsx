import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        user: 'all',
        dateRange: '7days'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getLogs(filters);
            setLogs(response.logs || response.data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            const errorMessage = error.message || 'Failed to load logs';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getTypeBadge = (type) => {
        const typeLower = type?.toLowerCase();
        if (typeLower === 'approval') return 'badge-approved';
        if (typeLower === 'system') return 'badge-active';
        if (typeLower === 'payment') return 'badge-approved';
        if (typeLower === 'security') return 'badge-rejected';
        return 'badge-pending';
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>⏳</div>
                <div style={{fontSize: '1.2em', color: '#565959'}}>Loading logs...</div>
            </div>
        );
    }

    if (error && logs.length === 0) {
        return (
            <div style={{textAlign: 'center', padding: '80px 20px'}}>
                <div style={{fontSize: '3em', marginBottom: '20px'}}>❌</div>
                <div style={{fontSize: '1.2em', color: '#C7511F', marginBottom: '20px'}}>{error}</div>
                <button 
                    onClick={fetchLogs} 
                    style={{background: '#FF9900', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="admin-logs-page">
            <style>{`
                h1 { font-size: 2em; margin-bottom: 10px; }
                .subtitle { color: #565959; margin-bottom: 30px; }
                
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
                .badge-active { background: #E7F3FF; color: #146EB4; }
                .badge-rejected { background: #FFE5E5; color: #C7511F; }
                .badge-pending { background: #FFF4E5; color: #F08804; }
            `}</style>

            <h1>Audit Logs</h1>
            <p className="subtitle">Track all system activities and administrative actions</p>

            <div className="section">
                <h2 className="section-title">Activity Log</h2>

                <div className="filter-bar">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                    <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="approval">Approval</option>
                        <option value="system">System</option>
                        <option value="payment">Payment</option>
                        <option value="security">Security</option>
                    </select>
                    <select value={filters.user} onChange={(e) => handleFilterChange('user', e.target.value)}>
                        <option value="all">All Users</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="system">System</option>
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
                            <th>Activity</th>
                            <th>User</th>
                            <th>Type</th>
                            <th>Timestamp</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map((log) => (
                            <tr key={log.id}>
                                <td>{log.activity || log.action || log.description}</td>
                                <td>{log.user || log.user_name || 'System'}</td>
                                <td>
                                    <span className={`badge ${getTypeBadge(log.type || log.operation)}`}>
                                        {log.type || log.operation || 'System'}
                                    </span>
                                </td>
                                <td>{formatTimestamp(log.timestamp || log.created_at)}</td>
                                <td>{log.ipAddress || log.ip_address || 'N/A'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#565959'}}>
                                    <div style={{fontSize: '2em', marginBottom: '10px'}}>📋</div>
                                    <div>No logs found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminLogsPage;
