/**
 * USER SEARCH MODAL
 * 
 * Modal for searching and selecting users to start a chat
 */

import { useState, useEffect } from 'react';
import api from '../../config/api';
import { useChat } from '../../contexts/ChatContext';

const UserSearchModal = ({ isOpen, onClose }) => {
  const { createConversation, joinConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [users, setUsers] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState({
    customers: [],
    sellers: [],
    admins: [],
    managers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'search'

  // Fetch all available users on mount
  useEffect(() => {
    if (isOpen && viewMode === 'grouped') {
      fetchAvailableUsers();
    }
  }, [isOpen, viewMode]);

  // Search users when search term changes
  useEffect(() => {
    if (searchTerm || selectedRole) {
      searchUsers();
    }
  }, [searchTerm, selectedRole]);

  const fetchAvailableUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/chat/users/available');
      
      if (response.success) {
        setGroupedUsers(response.data);
      }
    } catch (error) {
      console.error('[User Search] Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setIsLoading(true);
      setViewMode('search');
      
      const response = await api.get('/chat/users/search', {
        params: {
          search: searchTerm,
          role: selectedRole,
          limit: 20
        }
      });
      
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('[User Search] Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (user) => {
    try {
      // Create or get conversation
      const conversation = await createConversation(user.id);
      
      // Join conversation
      joinConversation(conversation.id);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('[User Search] Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedRole('');
    setViewMode('grouped');
    setUsers([]);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      seller: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: '👑',
      manager: '📊',
      seller: '🏪',
      customer: '👤'
    };
    return icons[role] || '👤';
  };

  const UserCard = ({ user }) => (
    <button
      onClick={() => handleStartChat(user)}
      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">
            {user.displayName}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
            {getRoleIcon(user.role)} {user.role}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">{user.email}</p>
      </div>

      {/* Chat Icon */}
      <div className="flex-shrink-0">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
    </button>
  );

  const UserGroup = ({ title, users, icon }) => {
    if (users.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
          <span className="text-gray-400">({users.length})</span>
        </h3>
        <div className="space-y-1">
          {users.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Start New Chat</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
              <option value="manager">Managers</option>
            </select>

            {/* Clear Button */}
            {(searchTerm || selectedRole) && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : viewMode === 'search' ? (
            // Search Results
            <div>
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p>No users found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {users.map(user => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Grouped View
            <div>
              <UserGroup
                title="Admins"
                users={groupedUsers.admins}
                icon="👑"
              />
              <UserGroup
                title="Managers"
                users={groupedUsers.managers}
                icon="📊"
              />
              <UserGroup
                title="Sellers"
                users={groupedUsers.sellers}
                icon="🏪"
              />
              <UserGroup
                title="Customers"
                users={groupedUsers.customers}
                icon="👤"
              />

              {groupedUsers.admins.length === 0 &&
               groupedUsers.managers.length === 0 &&
               groupedUsers.sellers.length === 0 &&
               groupedUsers.customers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No users available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
