import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';

const AdminRolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRoles: 0,
    totalUsers: 0,
    activeSellers: 0,
    adminManagers: 0
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from API
      const response = await adminAPI.getRoles();
      console.log('Roles API Response:', response);
      
      // Handle response structure
      const rolesData = response?.roles || response?.data?.roles || [];
      const statsData = response?.stats || response?.data?.stats || {};
      
      // Transform API data to match component format
      const transformedRoles = rolesData.map(role => ({
        id: role.id || role.name,
        name: role.name,
        type: role.type || 'System Role',
        icon: getRoleIcon(role.name),
        description: role.description || '',
        users: role.users?.toString() || '0',
        permissions: role.permissions || '0',
        keyPermissions: getKeyPermissions(role.name)
      }));
      
      setRoles(transformedRoles.length > 0 ? transformedRoles : mockRoles);
      
      // Set stats from API or calculate from data
      setStats({
        totalRoles: statsData.totalRoles || transformedRoles.length,
        totalUsers: statsData.totalUsers || 0,
        activeSellers: statsData.activeSellers || 0,
        adminManagers: statsData.adminManagers || 0
      });
      
    } catch (error) {
      console.error('Error fetching roles:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load roles';
      setError(errorMessage);
      toast.error(errorMessage);
      // Use mock data as fallback
      setRoles(mockRoles);
      setStats({
        totalRoles: 6,
        totalUsers: 45245,
        activeSellers: 1234,
        adminManagers: 27
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleIcon = (roleName) => {
    const icons = {
      'Administrator': '👑',
      'Manager': '👔',
      'Seller': '🏪',
      'Customer': '🛍️',
      'Support Agent': '💬',
      'Content Manager': '📝'
    };
    return icons[roleName] || '👤';
  };
  
  const getKeyPermissions = (roleName) => {
    const permissions = {
      'Administrator': ['Full system access', 'User management', 'Financial operations', 'System configuration'],
      'Manager': ['Product approvals', 'Order management', 'Dispute resolution', 'Customer support'],
      'Seller': ['Product management', 'Order fulfillment', 'Sales analytics', 'Customer messages'],
      'Customer': ['Browse & purchase', 'Order tracking', 'Write reviews', 'Manage wishlist'],
      'Support Agent': ['View customer data', 'Manage tickets', 'Process refunds', 'Send messages'],
      'Content Manager': ['Manage banners', 'Create promotions', 'Edit CMS pages', 'Manage coupons']
    };
    return permissions[roleName] || ['View permissions'];
  };

  const handleCreateRole = () => {
    toast.info('Create Custom Role feature coming soon!');
  };

  const handleViewRole = (role) => {
    toast.success(`Viewing ${role.name} details`);
  };

  const handleEditRole = (role) => {
    if (role.type === 'System Role') {
      toast.warning('System roles cannot be edited');
    } else {
      toast.success(`Editing ${role.name}`);
    }
  };

  if (loading) {
    return (
      <div className="admin-roles-page">
        <div className="loading-container">
          <div className="loading-icon">⏳</div>
          <div className="loading-text">Loading roles...</div>
        </div>
      </div>
    );
  }

  if (error && roles.length === 0) {
    return (
      <div className="admin-roles-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <div className="error-message">{error}</div>
          <button onClick={fetchRoles} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-roles-page">
      <style>{`
        .admin-roles-page {
          padding: 30px;
          background: #F7F8F8;
          min-height: 100vh;
        }
        
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 400px;
          text-align: center;
        }
        
        .loading-icon, .error-icon {
          font-size: 3em;
          margin-bottom: 20px;
        }
        
        .loading-text {
          font-size: 1.2em;
          color: #565959;
        }
        
        .error-message {
          font-size: 1.2em;
          color: #C7511F;
          margin-bottom: 20px;
        }
        
        .retry-button {
          background: #FF9900;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1em;
        }
        
        .retry-button:hover {
          background: #E88B00;
        }
        
        .page-header {
          margin-bottom: 30px;
        }
        
        .page-title {
          font-size: 2.2em;
          margin-bottom: 10px;
          color: #0F1111;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .page-subtitle {
          color: #565959;
          font-size: 1.05em;
          margin: 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: #FFFFFF;
          padding: 25px;
          border-radius: 8px;
          border: 1px solid #D5D9D9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-label {
          font-size: 0.9em;
          color: #565959;
          margin-bottom: 10px;
          font-weight: 500;
        }
        
        .stat-value {
          font-size: 2em;
          font-weight: bold;
          color: #FF9900;
          margin-bottom: 8px;
        }
        
        .stat-change {
          font-size: 0.9em;
          color: #067D62;
        }
        
        .roles-section {
          background: #FFFFFF;
          padding: 25px;
          border-radius: 8px;
          border: 1px solid #D5D9D9;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #F7F8F8;
        }
        
        .section-title {
          font-size: 1.4em;
          font-weight: 600;
          color: #0F1111;
          margin: 0;
        }
        
        .create-role-button {
          background: #FF9900;
          color: #FFFFFF;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.95em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .create-role-button:hover {
          background: #E88B00;
        }
        
        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 25px;
        }
        
        .role-card {
          background: #FFFFFF;
          border: 2px solid #D5D9D9;
          border-radius: 12px;
          padding: 25px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .role-card:hover {
          border-color: #FF9900;
          box-shadow: 0 4px 12px rgba(255, 153, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        
        .role-info {
          flex: 1;
        }
        
        .role-name {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 5px;
          color: #0F1111;
        }
        
        .role-type {
          font-size: 0.85em;
          color: #565959;
          background: #F7F8F8;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
        }
        
        .role-icon {
          font-size: 3em;
          opacity: 0.8;
        }
        
        .role-description {
          color: #565959;
          font-size: 0.95em;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        
        .role-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          padding: 15px;
          background: #F7F8F8;
          border-radius: 8px;
        }
        
        .role-stat {
          text-align: center;
          flex: 1;
        }
        
        .role-stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #FF9900;
          display: block;
        }
        
        .role-stat-label {
          font-size: 0.85em;
          color: #565959;
          margin-top: 4px;
        }
        
        .permissions-section {
          margin-bottom: 20px;
        }
        
        .permissions-title {
          font-weight: 600;
          margin-bottom: 12px;
          font-size: 0.95em;
          color: #0F1111;
        }
        
        .permission-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          font-size: 0.9em;
          color: #565959;
        }
        
        .checkmark {
          color: #067D62;
          font-weight: bold;
          font-size: 1.1em;
        }
        
        .role-actions {
          display: flex;
          gap: 10px;
        }
        
        .action-button {
          padding: 10px 16px;
          border: 1px solid #D5D9D9;
          background: #FFFFFF;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9em;
          flex: 1;
          text-align: center;
          color: #0F1111;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .action-button:hover {
          background: #F7F8F8;
          border-color: #FF9900;
        }
        
        .action-button.primary {
          background: #FF9900;
          color: white;
          border-color: #FF9900;
        }
        
        .action-button.primary:hover {
          background: #E88B00;
        }
        
        @media (max-width: 768px) {
          .admin-roles-page {
            padding: 20px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .roles-grid {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }
          
          .role-stats {
            flex-direction: column;
            gap: 10px;
          }
          
          .role-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">
          <span>👥</span>
          Role Management
        </h1>
        <p className="page-subtitle">
          Manage user roles and permissions across the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Roles</div>
          <div className="stat-value">{stats.totalRoles}</div>
          <div className="stat-change">4 System + 2 Custom</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
          <div className="stat-change">↑ 12.5% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Sellers</div>
          <div className="stat-value">{stats.activeSellers.toLocaleString()}</div>
          <div className="stat-change">↑ 8.3% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Admin & Managers</div>
          <div className="stat-value">{stats.adminManagers}</div>
          <div className="stat-change">3 Admins, 24 Managers</div>
        </div>
      </div>

      {/* Roles Section */}
      <div className="roles-section">
        <div className="section-header">
          <h2 className="section-title">Platform Roles</h2>
          <button onClick={handleCreateRole} className="create-role-button">
            <span>+</span>
            Create Custom Role
          </button>
        </div>

        <div className="roles-grid">
          {roles.map((role) => (
            <div key={role.id} className="role-card">
              <div className="role-header">
                <div className="role-info">
                  <div className="role-name">{role.name}</div>
                  <div className="role-type">{role.type}</div>
                </div>
                <div className="role-icon">{role.icon}</div>
              </div>
              
              <div className="role-description">{role.description}</div>
              
              <div className="role-stats">
                <div className="role-stat">
                  <span className="role-stat-value">{role.users}</span>
                  <div className="role-stat-label">Users</div>
                </div>
                <div className="role-stat">
                  <span className="role-stat-value">{role.permissions}</span>
                  <div className="role-stat-label">Permissions</div>
                </div>
              </div>
              
              <div className="permissions-section">
                <div className="permissions-title">Key Permissions:</div>
                {role.keyPermissions.map((perm, idx) => (
                  <div key={idx} className="permission-item">
                    <span className="checkmark">✓</span>
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
              
              <div className="role-actions">
                <button
                  onClick={() => handleViewRole(role)}
                  className="action-button"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleEditRole(role)}
                  className="action-button"
                >
                  {role.type === 'System Role' ? 'View Only' : 'Edit'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const mockRoles = [
  {
    id: 1,
    name: 'Administrator',
    type: 'System Role',
    icon: '👑',
    description: 'Full system access with complete control over all platform features, settings, and user management.',
    users: '3',
    permissions: 'All',
    keyPermissions: ['Full system access', 'User management', 'Financial operations', 'System configuration']
  },
  {
    id: 2,
    name: 'Manager',
    type: 'System Role',
    icon: '👔',
    description: 'Operational management role with permissions for approvals, moderation, and customer support.',
    users: '24',
    permissions: '45',
    keyPermissions: ['Product approvals', 'Order management', 'Dispute resolution', 'Customer support']
  },
  {
    id: 3,
    name: 'Seller',
    type: 'System Role',
    icon: '🏪',
    description: 'Vendor role with access to product management, order fulfillment, and sales analytics.',
    users: '1,234',
    permissions: '28',
    keyPermissions: ['Product management', 'Order fulfillment', 'Sales analytics', 'Customer messages']
  },
  {
    id: 4,
    name: 'Customer',
    type: 'System Role',
    icon: '🛍️',
    description: 'Standard customer role with shopping, order tracking, and account management capabilities.',
    users: '45.2K',
    permissions: '15',
    keyPermissions: ['Browse & purchase', 'Order tracking', 'Write reviews', 'Manage wishlist']
  },
  {
    id: 5,
    name: 'Support Agent',
    type: 'Custom Role',
    icon: '💬',
    description: 'Customer support role with limited access to customer data and ticket management.',
    users: '12',
    permissions: '18',
    keyPermissions: ['View customer data', 'Manage tickets', 'Process refunds', 'Send messages']
  },
  {
    id: 6,
    name: 'Content Manager',
    type: 'Custom Role',
    icon: '📝',
    description: 'Content management role for banners, promotions, and marketing materials.',
    users: '5',
    permissions: '12',
    keyPermissions: ['Manage banners', 'Create promotions', 'Edit CMS pages', 'Manage coupons']
  }
];

export default AdminRolesPage;