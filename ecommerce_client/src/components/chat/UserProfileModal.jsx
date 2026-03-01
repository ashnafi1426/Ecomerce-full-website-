/**
 * USER PROFILE MODAL
 * 
 * Displays user profile information in Telegram style
 */

import { useEffect, useState } from 'react';
import { formatLastSeen } from '../../utils/timeFormat';
import apiService from '../../services/api.service';

const UserProfileModal = ({ isOpen, onClose, userId, onStartChat }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      // Reset state when modal opens
      setUser(null);
      setLoading(true);
      setError(null);
      fetchUserProfile();
    }
  }, [isOpen, userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile
      console.log('🔍 Fetching user profile for:', userId);
      const data = await apiService.get(`/users/${userId}`);
      console.log('✅ Profile data received:', data);
      console.log('📦 Data structure:', {
        hasData: !!data,
        keys: Object.keys(data || {}),
        display_name: data?.display_name,
        email: data?.email
      });
      setUser(data);
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (onStartChat && user) {
      onStartChat(user);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 animate-pulse"></div>
              <div className="mt-4 h-6 w-32 bg-white bg-opacity-20 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-white">{error}</p>
            </div>
          ) : user ? (
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold shadow-lg">
                  {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                </div>
                {/* Online Status Indicator */}
                {user.is_online && (
                  <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-white"></div>
                )}
              </div>

              {/* Name */}
              <h2 className="mt-4 text-2xl font-bold">
                {user.display_name || 'Unknown User'}
              </h2>

              {/* Online Status */}
              <p className="mt-1 text-blue-100 text-sm">
                {user.is_online ? 'Online' : formatLastSeen(user.last_seen_at)}
              </p>
            </div>
          ) : null}
        </div>

        {/* Body */}
        {!loading && !error && user && (
          <div className="p-6 space-y-4">
            {/* User Info */}
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{user.role}</p>
                </div>
              </div>

              {/* Phone (if available) */}
              {user.phone && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleStartChat}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Send Message</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
