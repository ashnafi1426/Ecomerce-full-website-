import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.service';
import { toast } from 'react-toastify';
import { FaUsers, FaUserShield, FaStore, FaShoppingCart, FaPlus, FaEye, FaSearch, FaTimes, FaCheck, FaCrown, FaBriefcase } from 'react-icons/fa';

const AdminRolesPageProfessional = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showQuickAssignModal, setShowQuickAssignModal] = useState(false);
  const [quickAssignUser, setQuickAssignUser] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState('bulk'); // 'bulk' or 'individual'
  const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
  const [userToChange, setUserToChange] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, usersData] = await Promise.all([
        adminAPI.getRoles(),
        adminAPI.getUsers()
      ]);

      const rolesArray = rolesData?.roles || rolesData?.data?.roles || [];
      const statsData = rolesData?.stats || rolesData?.data?.stats || {};
      const usersArray = usersData?.users || usersData?.data?.users || [];

      setRoles(rolesArray);
      setUsers(usersArray);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load roles data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedRole || selectedUsers.length === 0) {
      toast.error('Please select a role and at least one user');
      return;
    }

    try {
      // Map role names to backend format
      const roleMapping = {
        'Administrator': 'admin',
        'Manager': 'manager',
        'Seller': 'seller',
        'Customer': 'customer'
      };

      const backendRole = roleMapping[selectedRole.name] || selectedRole.name.toLowerCase();
      
      console.log('🔄 Assigning role:', {
        frontendRole: selectedRole.name,
        backendRole,
        userCount: selectedUsers.length,
        userIds: selectedUsers
      });

      // Update each user's role
      const results = await Promise.all(
        selectedUsers.map(async (userId) => {
          try {
            const result = await adminAPI.updateUser(userId, { role: backendRole });
            console.log('✅ Role assigned to user:', userId);
            return { userId, success: true };
          } catch (error) {
            console.error('❌ Failed to assign role to user:', userId, error);
            return { userId, success: false, error };
          }
        })
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully assigned ${selectedRole.name} role to ${successCount} user(s)`);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to assign role to ${failCount} user(s)`);
      }

      // Close modal and refresh data
      setShowAssignModal(false);
      setSelectedUsers([]);
      setSelectedRole(null);
      await fetchData();
    } catch (error) {
      console.error('❌ Bulk assign error:', error);
      toast.error('Failed to assign roles. Please try again.');
    }
  };

  const handleQuickAssign = async (user, newRole) => {
    try {
      // Map role names to backend format
      const roleMapping = {
        'Administrator': 'admin',
        'Manager': 'manager',
        'Seller': 'seller',
        'Customer': 'customer'
      };

      const backendRole = roleMapping[newRole] || newRole.toLowerCase();
      
      console.log('🔄 Quick assigning role:', {
        userId: user.id,
        userEmail: user.email,
        currentRole: user.role,
        newRole: newRole,
        backendRole
      });

      await adminAPI.updateUser(user.id, { role: backendRole });
      
      toast.success(`Successfully changed ${user.email}'s role to ${newRole}`);
      setShowQuickAssignModal(false);
      setQuickAssignUser(null);
      await fetchData();
    } catch (error) {
      console.error('❌ Quick assign error:', error);
      toast.error('Failed to assign role. Please try again.');
    }
  };

  const handleIndividualAssign = async (userId, newRole) => {
    try {
      const roleMapping = {
        'Administrator': 'admin',
        'Manager': 'manager',
        'Seller': 'seller',
        'Customer': 'customer'
      };

      const backendRole = roleMapping[newRole] || newRole.toLowerCase();
      
      await adminAPI.updateUser(userId, { role: backendRole });
      
      toast.success(`Role updated to ${newRole}`);
      await fetchData();
    } catch (error) {
      console.error('❌ Individual assign error:', error);
      toast.error('Failed to update role');
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      const roleMapping = {
        'Administrator': 'admin',
        'Manager': 'manager',
        'Seller': 'seller',
        'Customer': 'customer'
      };

      const backendRole = roleMapping[newRole] || newRole.toLowerCase();
      
      console.log('🔄 Changing role:', {
        userId: user.id,
        userEmail: user.email,
        currentRole: user.role,
        newRole: newRole,
        backendRole
      });

      await adminAPI.updateUser(user.id, { role: backendRole });
      
      toast.success(`Successfully changed ${user.email}'s role from ${user.role} to ${newRole}`);
      setShowChangeRoleModal(false);
      setUserToChange(null);
      await fetchData();
    } catch (error) {
      console.error('❌ Change role error:', error);
      toast.error('Failed to change role. Please try again.');
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || role.type.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (roleName) => {
    const icons = {
      'Administrator': <FaCrown className="role-icon-svg" />,
      'Manager': <FaBriefcase className="role-icon-svg" />,
      'Seller': <FaStore className="role-icon-svg" />,
      'Customer': <FaShoppingCart className="role-icon-svg" />
    };
    return icons[roleName] || <FaUsers className="role-icon-svg" />;
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'Administrator': '#FF6B6B',
      'Manager': '#4ECDC4',
      'Seller': '#FFD93D',
      'Customer': '#95E1D3'
    };
    return colors[roleName] || '#A8DADC';
  };

  if (loading) {
    return (
      <div className="admin-roles-professional">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading roles management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-roles-professional">
      <style>{`
        .admin-roles-professional {
          padding: 24px;
          background: #f8f9fa;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e9ecef;
          border-top-color: #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-header {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-title h1 {
          font-size: 32px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn-secondary:hover {
          background: #f8f9ff;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }

        .stat-label {
          font-size: 14px;
          color: #6c757d;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .stat-change {
          font-size: 13px;
          color: #28a745;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 24px;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 300px;
          position: relative;
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }

        .filter-group {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 12px 20px;
          border: 2px solid #e9ecef;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6c757d;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .filter-btn:hover {
          border-color: #667eea;
        }

        .roles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .role-card {
          background: white;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .role-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: var(--role-color);
        }

        .role-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }

        .role-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .role-info {
          flex: 1;
        }

        .role-name {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .role-type-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #f8f9fa;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #6c757d;
        }

        .role-icon-container {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: var(--role-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
        }

        .role-icon-svg {
          width: 32px;
          height: 32px;
        }

        .role-description {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .role-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 12px;
        }

        .role-stat {
          text-align: center;
        }

        .role-stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--role-color);
          display: block;
        }

        .role-stat-label {
          font-size: 12px;
          color: #6c757d;
          margin-top: 4px;
          font-weight: 500;
        }

        .role-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .role-action-btn {
          padding: 12px;
          border: 2px solid #e9ecef;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #495057;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .role-action-btn:hover {
          border-color: var(--role-color);
          color: var(--role-color);
          background: rgba(102, 126, 234, 0.05);
        }

        .role-action-btn.primary {
          background: var(--role-color);
          color: white;
          border-color: var(--role-color);
        }

        .role-action-btn.primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
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
          padding: 20px;
        }

        .modal {
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border: none;
          background: #f8f9fa;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6c757d;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: #e9ecef;
          color: #1a1a1a;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid #e9ecef;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .user-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .user-item {
          padding: 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-item:hover {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .user-item.selected {
          border-color: #667eea;
          background: #f8f9ff;
        }

        .user-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }

        .user-email {
          font-size: 13px;
          color: #6c757d;
        }

        .user-role-badge {
          padding: 4px 12px;
          background: #e9ecef;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #495057;
        }

        @media (max-width: 768px) {
          .admin-roles-professional {
            padding: 16px;
          }

          .roles-grid {
            grid-template-columns: 1fr;
          }

          .filters-section {
            flex-direction: column;
          }

          .search-box {
            min-width: 100%;
          }

          .role-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <div className="header-top">
          <div className="header-title">
            <div className="header-icon">
              <FaUserShield />
            </div>
            <div>
              <h1>Role Management</h1>
              <p style={{ color: '#6c757d', margin: '8px 0 0 0' }}>
                Manage user roles, permissions, and access control
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => {
              if (users.length > 0) {
                setUserToChange(users[0]);
                setShowChangeRoleModal(true);
              }
            }}>
              🔄 Change Role
            </button>
            <button className="btn btn-secondary" onClick={() => {
              setQuickAssignUser(users[0]);
              setShowQuickAssignModal(true);
            }}>
              ⚡ Quick Assign
            </button>
            <button className="btn btn-primary" onClick={() => {
              setAssignmentMode('bulk');
              setShowAssignModal(true);
            }}>
              <FaUsers /> Bulk Assign
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Roles</div>
              <div className="stat-value">{stats.totalRoles || roles.length}</div>
              <div className="stat-change">
                {stats.systemRoles || 4} System • {stats.customRoles || 0} Custom
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{(stats.totalUsers || 0).toLocaleString()}</div>
              <div className="stat-change">↑ 12.5% from last month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Sellers</div>
              <div className="stat-value">{(stats.activeSellers || 0).toLocaleString()}</div>
              <div className="stat-change">↑ 8.3% from last month</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Admin & Managers</div>
              <div className="stat-value">{stats.adminManagers || 0}</div>
              <div className="stat-change">
                {stats.totalRoles ? `${Math.floor(stats.adminManagers / 4)} Admins` : '3 Admins, 8 Managers'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Roles
          </button>
          <button
            className={`filter-btn ${filterType === 'system' ? 'active' : ''}`}
            onClick={() => setFilterType('system')}
          >
            System
          </button>
          <button
            className={`filter-btn ${filterType === 'custom' ? 'active' : ''}`}
            onClick={() => setFilterType('custom')}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="roles-grid">
        {filteredRoles.map((role) => (
          <div
            key={role.id || role.name}
            className="role-card"
            style={{ '--role-color': getRoleColor(role.name) }}
          >
            <div className="role-header">
              <div className="role-info">
                <div className="role-name">{role.name}</div>
                <span className="role-type-badge">{role.type}</span>
              </div>
              <div className="role-icon-container">
                {getRoleIcon(role.name)}
              </div>
            </div>

            <div className="role-description">{role.description}</div>

            <div className="role-stats">
              <div className="role-stat">
                <span className="role-stat-value">{role.users || 0}</span>
                <div className="role-stat-label">Users</div>
              </div>
              <div className="role-stat">
                <span className="role-stat-value">{role.permissions || 0}</span>
                <div className="role-stat-label">Permissions</div>
              </div>
            </div>

            <div className="role-actions">
              <button
                className="role-action-btn"
                onClick={() => {
                  setSelectedRole(role);
                  setShowPermissionsModal(true);
                }}
              >
                <FaEye /> View Details
              </button>
              <button
                className="role-action-btn primary"
                onClick={() => {
                  setSelectedRole(role);
                  setShowAssignModal(true);
                }}
              >
                <FaUsers /> Assign Users
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {assignmentMode === 'bulk' ? 'Bulk Assign Role' : 'Individual Assignment'}
                {selectedRole ? `: ${selectedRole.name}` : ''}
              </h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            {/* Assignment Mode Toggle */}
            <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid',
                    borderColor: assignmentMode === 'bulk' ? '#667eea' : '#e9ecef',
                    background: assignmentMode === 'bulk' ? '#f8f9ff' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: assignmentMode === 'bulk' ? '#667eea' : '#6c757d'
                  }}
                  onClick={() => setAssignmentMode('bulk')}
                >
                  📦 Bulk Assignment
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid',
                    borderColor: assignmentMode === 'individual' ? '#667eea' : '#e9ecef',
                    background: assignmentMode === 'individual' ? '#f8f9ff' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: assignmentMode === 'individual' ? '#667eea' : '#6c757d'
                  }}
                  onClick={() => setAssignmentMode('individual')}
                >
                  👤 Individual Assignment
                </button>
              </div>
            </div>

            <div className="modal-body">
              {assignmentMode === 'bulk' ? (
                <>
                  <p style={{ marginBottom: '16px', color: '#6c757d' }}>
                    Select multiple users to assign the {selectedRole?.name} role
                  </p>
                  <div className="user-list">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`user-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedUsers(prev =>
                            prev.includes(user.id)
                              ? prev.filter(id => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                      >
                        <input
                          type="checkbox"
                          className="user-checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => {}}
                        />
                        <div className="user-info">
                          <div className="user-name">{user.name || user.displayName || user.email}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                        <span className="user-role-badge">{user.role}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: '16px', color: '#6c757d' }}>
                    Click on a user to assign them a specific role individually
                  </p>
                  <div className="user-list">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          padding: '16px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          background: 'white'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                              {user.name || user.displayName || user.email}
                            </div>
                            <div style={{ fontSize: '13px', color: '#6c757d' }}>{user.email}</div>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            background: '#e9ecef',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            Current: {user.role}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                          {['Administrator', 'Manager', 'Seller', 'Customer'].map(role => (
                            <button
                              key={role}
                              onClick={() => handleIndividualAssign(user.id, role)}
                              disabled={user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase())}
                              style={{
                                padding: '8px 12px',
                                border: '2px solid',
                                borderColor: user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? '#28a745' : '#e9ecef',
                                background: user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? '#d4edda' : 'white',
                                borderRadius: '6px',
                                cursor: user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? '#155724' : '#495057',
                                transition: 'all 0.2s',
                                opacity: user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? 0.7 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!(user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()))) {
                                  e.target.style.borderColor = '#667eea';
                                  e.target.style.background = '#f8f9ff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!(user.role === role.toLowerCase() || user.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()))) {
                                  e.target.style.borderColor = '#e9ecef';
                                  e.target.style.background = 'white';
                                }
                              }}
                            >
                              {role === 'Administrator' ? '👑' : role === 'Manager' ? '💼' : role === 'Seller' ? '🏪' : '🛒'} {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {assignmentMode === 'bulk' && (
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleBulkAssign}
                  disabled={selectedUsers.length === 0}
                >
                  <FaCheck /> Assign to {selectedUsers.length} User(s)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Assign Modal */}
      {showQuickAssignModal && quickAssignUser && (
        <div className="modal-overlay" onClick={() => setShowQuickAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Quick Role Assignment</h2>
              <button className="modal-close" onClick={() => setShowQuickAssignModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  {quickAssignUser.name || quickAssignUser.displayName || quickAssignUser.email}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>{quickAssignUser.email}</div>
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  Current Role: <span style={{ 
                    padding: '2px 8px', 
                    background: '#e9ecef', 
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>{quickAssignUser.role}</span>
                </div>
              </div>
              
              <p style={{ marginBottom: '16px', color: '#6c757d', fontWeight: '500' }}>
                Select new role:
              </p>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {['Administrator', 'Manager', 'Seller', 'Customer'].map(role => (
                  <button
                    key={role}
                    onClick={() => handleQuickAssign(quickAssignUser, role)}
                    disabled={quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase())}
                    style={{
                      padding: '16px',
                      border: '2px solid',
                      borderColor: quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? '#28a745' : '#e9ecef',
                      background: quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? '#d4edda' : 'white',
                      borderRadius: '8px',
                      cursor: quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1a1a1a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                      opacity: quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!(quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()))) {
                        e.target.style.borderColor = getRoleColor(role);
                        e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase()))) {
                        e.target.style.borderColor = '#e9ecef';
                        e.target.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px',
                      background: getRoleColor(role),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px'
                    }}>
                      {getRoleIcon(role)}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div>{role}</div>
                      {(quickAssignUser.role === role.toLowerCase() || quickAssignUser.role === (role === 'Administrator' ? 'admin' : role.toLowerCase())) && (
                        <div style={{ fontSize: '12px', color: '#28a745', marginTop: '2px' }}>
                          ✓ Current Role
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowQuickAssignModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal - Dedicated for Role Changes/Demotions */}
      {showChangeRoleModal && (
        <div className="modal-overlay" onClick={() => setShowChangeRoleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 className="modal-title">🔄 Change User Role</h2>
              <button className="modal-close" onClick={() => setShowChangeRoleModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ 
                padding: '16px', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                  Select a user to change their role (promote or demote)
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  ⚠️ Changing roles will immediately affect user permissions
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#1a1a1a'
                }}>
                  Select User:
                </label>
                <select
                  value={userToChange?.id || ''}
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    setUserToChange(user);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="">-- Select a user --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.email} (Current: {user.role})
                    </option>
                  ))}
                </select>
              </div>

              {userToChange && (
                <>
                  <div style={{ 
                    padding: '16px', 
                    background: '#f8f9fa', 
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '700'
                      }}>
                        {(userToChange.name || userToChange.email).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {userToChange.name || userToChange.displayName || userToChange.email}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6c757d' }}>
                          {userToChange.email}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 16px',
                        background: '#e9ecef',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#495057'
                      }}>
                        Current: {userToChange.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontWeight: '600', 
                      marginBottom: '12px',
                      color: '#1a1a1a',
                      fontSize: '16px'
                    }}>
                      Change to:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {['Administrator', 'Manager', 'Seller', 'Customer'].map(role => {
                        const isCurrentRole = userToChange.role === role.toLowerCase() || 
                                            userToChange.role === (role === 'Administrator' ? 'admin' : role.toLowerCase());
                        const roleHierarchy = { 'admin': 4, 'manager': 3, 'seller': 2, 'customer': 1 };
                        const currentLevel = roleHierarchy[userToChange.role] || 0;
                        const newLevel = roleHierarchy[role === 'Administrator' ? 'admin' : role.toLowerCase()] || 0;
                        const isPromotion = newLevel > currentLevel;
                        const isDemotion = newLevel < currentLevel;
                        
                        return (
                          <button
                            key={role}
                            onClick={() => handleChangeRole(userToChange, role)}
                            disabled={isCurrentRole}
                            style={{
                              padding: '16px',
                              border: '2px solid',
                              borderColor: isCurrentRole ? '#28a745' : '#e9ecef',
                              background: isCurrentRole ? '#d4edda' : 'white',
                              borderRadius: '12px',
                              cursor: isCurrentRole ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: isCurrentRole ? 0.6 : 1,
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrentRole) {
                                e.target.style.borderColor = getRoleColor(role);
                                e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrentRole) {
                                e.target.style.borderColor = '#e9ecef';
                                e.target.style.background = 'white';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                              }
                            }}
                          >
                            {!isCurrentRole && isPromotion && (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: '#28a745',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '700'
                              }}>
                                ⬆ PROMOTE
                              </div>
                            )}
                            {!isCurrentRole && isDemotion && (
                              <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: '#ffc107',
                                color: '#000',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '700'
                              }}>
                                ⬇ DEMOTE
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: getRoleColor(role),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '24px'
                              }}>
                                {getRoleIcon(role)}
                              </div>
                              <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a1a' }}>
                                  {role}
                                </div>
                                {isCurrentRole && (
                                  <div style={{ fontSize: '11px', color: '#28a745', marginTop: '2px' }}>
                                    ✓ Current Role
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{
                    padding: '12px 16px',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#856404'
                  }}>
                    <strong>⚠️ Warning:</strong> Role changes take effect immediately and will modify user permissions.
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowChangeRoleModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="modal-overlay" onClick={() => setShowPermissionsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedRole.name} - Permissions & Details
              </h2>
              <button className="modal-close" onClick={() => setShowPermissionsModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div 
                    className="role-icon-container" 
                    style={{ 
                      background: getRoleColor(selectedRole.name),
                      width: '64px',
                      height: '64px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '32px'
                    }}
                  >
                    {getRoleIcon(selectedRole.name)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
                      {selectedRole.name}
                    </h3>
                    <span style={{ 
                      padding: '4px 12px', 
                      background: '#f8f9fa', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      color: '#6c757d'
                    }}>
                      {selectedRole.type}
                    </span>
                  </div>
                </div>
                
                <p style={{ color: '#6c757d', lineHeight: '1.6', marginBottom: '24px' }}>
                  {selectedRole.description}
                </p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '16px', 
                  marginBottom: '24px',
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: getRoleColor(selectedRole.name) 
                    }}>
                      {selectedRole.users || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                      Total Users
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: getRoleColor(selectedRole.name) 
                    }}>
                      {selectedRole.activeUsers || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                      Active Users
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: getRoleColor(selectedRole.name) 
                    }}>
                      {selectedRole.permissionCount || selectedRole.permissions || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                      Permissions
                    </div>
                  </div>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  Key Permissions
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedRole.keyPermissions && selectedRole.keyPermissions.map((permission, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '12px 16px',
                        background: 'white',
                        border: '2px solid #e9ecef',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FaCheck style={{ color: '#28a745', fontSize: '16px' }} />
                      <span style={{ fontSize: '14px', color: '#495057' }}>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPermissionsModal(false)}>
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowPermissionsModal(false);
                  setShowAssignModal(true);
                }}
              >
                <FaUsers /> Assign Users to This Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRolesPageProfessional;
