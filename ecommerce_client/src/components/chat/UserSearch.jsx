/**
 * USER SEARCH
 * 
 * Search for users to start new conversations
 * Supports searching Customers, Sellers, Admins, and Managers
 */

import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../../contexts/ChatContext';
import api from '../../config/api';
import { debounce } from 'lodash';

const UserSearch = ({ onSelectUser, onClose }) => {
  const { createConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [groupedUsers, setGroupedUsers] = useState({
    customers: [],
    sellers: [],
    admins: [],
    managers: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(''); // '', 'customer', 'seller', 'admin', 'manager'
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'search'

  // Load all available users on mount
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      setIsLoadingAll(true);
      const response = await api.get('/chat/users/available');
      
      if (response.success) {
        setGroupedUsers(response.data);
      }
    } catch (error) {
      console.error('[UserSearch] Error loading users:', error);
    } finally {
      setIsLoadingAll(false);
    }
  };

  // Debounced search function
  const searchUsers = useCallback(
    debounce(async (query, filter) => {
      if (!query.trim() && !filter) {
        setViewMode('grouped');
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      setViewMode('search');
      
      try {
        const response = await api.get('/chat/users/search', {
          params: {
            search: query,
            role: filter,
            limit: 50
          }
        });

        if (response.success) {
          setSearchResults(response.data);
        }
      } catch (error) {
        console.error('[UserSearch] Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchQuery || selectedFilter) {
      searchUsers(searchQuery, selectedFilter);
    } else {
      setViewMode('grouped');
      setSearchResults([]);
    }
  }, [searchQuery, selectedFilter, searchUsers]);

  const handleSelectUser = async (user) => {
    try {
      // Create or get existing conversation
      const conversation = await createConversation(user.id, {
        participant_name: user.displayName
      });

      if (conversation) {
        onSelectUser(conversation);
      }
    } catch (error) {
      console.error('[UserSearch] Error creating conversation:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'manager':
        return 'bg-purple-100 text-purple-700';
      case 'seller':
        return 'bg-blue-100 text-blue-700';
      case 'customer':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'manager':
        return '📊';
      case 'seller':
        return '🏪';
      case 'customer':
        return '👤';
      default:
        return '👤';
    }
  };

  const UserCard = ({ user }) => (
    <button
      onClick={() => handleSelectUser(user)}
      className="w-full p-3 hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3 text-left rounded-lg"
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
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
            {getInitials(user.displayName)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900 truncate">
            {user.displayName}
          </h4>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
            {getRoleIcon(user.role)} {user.role}
          </span>
        </div>
        
        {/* Email */}
        <p className="text-xs text-gray-500 truncate">
          {user.email}
        </p>
      </div>

      {/* Chat Icon */}
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    </button>
  );

  const UserGroup = ({ title, users, icon }) => {
    if (users.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200">
        {/* Search Input */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('admin')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👑 Admins
          </button>
          <button
            onClick={() => setSelectedFilter('manager')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === 'manager'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Managers
          </button>
          <button
            onClick={() => setSelectedFilter('seller')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === 'seller'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏪 Sellers
          </button>
          <button
            onClick={() => setSelectedFilter('customer')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedFilter === 'customer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            👤 Customers
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoadingAll ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'search' ? (
          // Search Results
          <div>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-center">No users found</p>
                <p className="text-xs text-center mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map(user => (
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
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-center">No users available</p>
                <p className="text-xs text-center mt-1">Start by searching for users</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
