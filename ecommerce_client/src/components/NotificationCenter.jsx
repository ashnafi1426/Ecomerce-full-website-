import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, archived
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    // Don't automatically mark as read when opening dropdown
  }, [isOpen, filter]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async (loadMore = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const currentPage = loadMore ? page + 1 : 0;
      
      const params = new URLSearchParams({
        limit: 20,
        offset: currentPage * 20,
        unreadOnly: filter === 'unread',
        includeArchived: filter === 'archived'
      });

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.data.notifications;
        
        if (loadMore) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
        }
        
        setPage(currentPage);
        setHasMore(newNotifications.length === 20);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification, event) => {
    // Don't navigate if clicking on action buttons
    if (event.target.closest('.action-btn')) {
      return;
    }

    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the action URL if it exists
    if (notification.action_url) {
      setIsOpen(false); // Close the dropdown
      navigate(notification.action_url);
    }
  };

  const handleActionClick = (notification, action, event) => {
    event.stopPropagation();
    
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Handle different actions
    switch (action) {
      case 'view':
        if (notification.action_url) {
          setIsOpen(false);
          navigate(notification.action_url);
        }
        break;
      case 'dismiss':
        deleteNotification(notification.id);
        break;
      case 'archive':
        // Archive notification (mark as read and hide)
        markAsRead(notification.id);
        break;
      default:
        if (notification.action_url) {
          setIsOpen(false);
          navigate(notification.action_url);
        }
    }
  };

  const getActionButtons = (notification) => {
    const buttons = [];

    // Type-specific actions - always show regardless of read status
    switch (notification.type) {
      case 'order_placed':
      case 'order_confirmed':
      case 'order_shipped':
        buttons.push({
          label: 'Track Order',
          action: 'view',
          primary: true
        });
        break;
      
      case 'order_delivered':
        buttons.push({
          label: 'View Order',
          action: 'view',
          primary: true
        });
        break;

      case 'payment_received':
      case 'payout_processed':
        buttons.push({
          label: 'View Payment',
          action: 'view',
          primary: true
        });
        break;

      case 'payment_failed':
        buttons.push({
          label: 'Retry Payment',
          action: 'view',
          primary: true
        });
        break;

      case 'product_approved':
        buttons.push({
          label: 'View Product',
          action: 'view',
          primary: true
        });
        break;

      case 'product_rejected':
        buttons.push({
          label: 'Edit Product',
          action: 'view',
          primary: true
        });
        break;

      case 'product_low_stock':
      case 'product_out_of_stock':
        buttons.push({
          label: 'Update Stock',
          action: 'view',
          primary: true
        });
        break;

      case 'new_review':
        buttons.push({
          label: 'View Review',
          action: 'view',
          primary: true
        });
        break;

      case 'new_message':
        buttons.push({
          label: 'Reply',
          action: 'view',
          primary: true
        });
        break;

      case 'seller_approved':
        buttons.push({
          label: 'Go to Dashboard',
          action: 'view',
          primary: true
        });
        break;

      case 'commission_updated':
        buttons.push({
          label: 'View Details',
          action: 'view',
          primary: true
        });
        break;

      case 'system_announcement':
        buttons.push({
          label: 'Read More',
          action: 'view',
          primary: true
        });
        break;

      case 'security_alert':
        buttons.push({
          label: 'Review Activity',
          action: 'view',
          primary: true
        });
        break;

      default:
        // For any notification with action_url, show View button
        if (notification.action_url) {
          buttons.push({
            label: notification.action_text || 'View Details',
            action: 'view',
            primary: true
          });
        }
        break;
    }

    // Always add dismiss button - same position for all notifications
    buttons.push({
      label: 'Dismiss',
      action: 'dismiss',
      primary: false
    });

    return buttons;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      order_placed: '🛍️',
      order_confirmed: '✅',
      order_shipped: '🚚',
      order_delivered: '📦',
      order_cancelled: '❌',
      payment_received: '💰',
      payment_failed: '⚠️',
      payout_processed: '💵',
      product_approved: '✅',
      product_rejected: '❌',
      product_low_stock: '📉',
      product_out_of_stock: '🚫',
      new_review: '⭐',
      new_message: '💬',
      seller_approved: '🎉',
      seller_rejected: '❌',
      commission_updated: '💰',
      system_announcement: '📢',
      account_update: '👤',
      security_alert: '🔒'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F59E0B',
      urgent: '#EF4444'
    };
    return colors[priority] || colors.medium;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <style>{`
        .notification-center {
          position: relative;
        }

        .notification-bell {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 24px;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .notification-bell:hover {
          background: #F3F4F6;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #EF4444;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: bold;
          min-width: 18px;
          text-align: center;
        }

        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 400px;
          max-width: 95vw;
          max-height: 600px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 768px) {
          .notification-dropdown {
            width: 360px;
          }
        }

        @media (max-width: 480px) {
          .notification-dropdown {
            width: 100vw;
            max-width: 100vw;
            right: -16px;
            border-radius: 12px 12px 0 0;
            max-height: 80vh;
          }
          
          .notification-header {
            padding: 12px 16px;
          }
          
          .notification-title {
            font-size: 16px;
          }
          
          .notification-filters {
            padding: 8px 16px;
          }
          
          .notification-item {
            padding: 12px 16px;
          }
          
          .notification-icon {
            font-size: 20px;
          }
          
          .notification-item-title {
            font-size: 13px;
          }
          
          .notification-message {
            font-size: 12px;
          }
        }

        .notification-header {
          padding: 16px 20px;
          border-bottom: 1px solid #E5E7EB;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .notification-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .notification-filters {
          display: flex;
          gap: 8px;
          padding: 12px 20px;
          border-bottom: 1px solid #E5E7EB;
        }

        .filter-btn {
          padding: 6px 12px;
          border: 1px solid #D1D5DB;
          background: white;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #F3F4F6;
        }

        .filter-btn.active {
          background: #FF9900;
          color: white;
          border-color: #FF9900;
        }

        .notification-list {
          flex: 1;
          overflow-y: auto;
          max-height: 450px;
        }

        .notification-item {
          padding: 16px 20px;
          border-bottom: 1px solid #F3F4F6;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: #F9FAFB;
        }

        .notification-item.unread {
          background: #FEF3C7;
        }

        .notification-item.unread:hover {
          background: #FDE68A;
        }

        .notification-content {
          display: flex;
          gap: 12px;
        }

        .notification-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .notification-body {
          flex: 1;
          min-width: 0;
        }

        .notification-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .notification-message {
          font-size: 13px;
          color: #6B7280;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #9CA3AF;
        }

        .notification-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .notification-priority {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .notification-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          min-height: 28px; /* Fixed height to prevent layout shift */
        }

        .action-btn {
          padding: 4px 12px;
          border: 1px solid #D1D5DB;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap; /* Prevent text wrapping */
        }

        .action-btn:hover {
          background: #F3F4F6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-btn.primary {
          background: #FF9900;
          color: white;
          border-color: #FF9900;
        }

        .action-btn.primary:hover {
          background: #F08804;
          box-shadow: 0 2px 6px rgba(255, 153, 0, 0.3);
        }

        .notification-footer {
          padding: 12px 20px;
          border-top: 1px solid #E5E7EB;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .load-more-btn {
          padding: 8px 16px;
          background: #F3F4F6;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .load-more-btn:hover {
          background: #E5E7EB;
        }

        .mark-all-read-btn {
          padding: 8px 16px;
          background: #FF9900;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mark-all-read-btn:hover {
          background: #F08804;
        }

        .empty-state {
          padding: 60px 20px;
          text-align: center;
          color: #9CA3AF;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-text {
          font-size: 14px;
        }

        .loading-state {
          padding: 40px 20px;
          text-align: center;
          color: #9CA3AF;
        }

        @media (max-width: 480px) {
          .notification-dropdown {
            width: 100vw;
            max-width: 100vw;
            right: -16px;
            border-radius: 12px 12px 0 0;
            max-height: 80vh;
          }
          
          .notification-header {
            padding: 12px 16px;
          }
          
          .notification-title {
            font-size: 16px;
          }
          
          .notification-filters {
            padding: 8px 16px;
          }
          
          .notification-item {
            padding: 12px 16px;
          }
          
          .notification-icon {
            font-size: 20px;
          }
          
          .notification-item-title {
            font-size: 13px;
          }
          
          .notification-message {
            font-size: 12px;
          }
          
          .mark-all-read-btn {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .filter-btn {
            padding: 5px 10px;
            font-size: 12px;
          }
        }
      `}</style>

      {/* Notification Bell */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <div className="notification-title">Notifications</div>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="notification-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="loading-state">
                <div>⏳ Loading notifications...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔔</div>
                <div className="empty-text">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </div>
              </div>
            ) : (
              <>
                {notifications.map(notification => {
                  const actionButtons = getActionButtons(notification);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      <div className="notification-content">
                        <div className="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="notification-body">
                          <div className="notification-item-title">
                            {notification.title}
                          </div>
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          <div className="notification-meta">
                            <span className="notification-time">
                              🕐 {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.priority !== 'medium' && (
                              <span
                                className="notification-priority"
                                style={{
                                  backgroundColor: getPriorityColor(notification.priority) + '20',
                                  color: getPriorityColor(notification.priority)
                                }}
                              >
                                {notification.priority}
                              </span>
                            )}
                          </div>
                          {/* Action Buttons */}
                          {actionButtons.length > 0 && (
                            <div className="notification-actions">
                              {actionButtons.map((btn, index) => (
                                <button
                                  key={index}
                                  className={`action-btn ${btn.primary ? 'primary' : ''}`}
                                  onClick={(e) => handleActionClick(notification, btn.action, e)}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              {hasMore && (
                <button
                  className="load-more-btn"
                  onClick={() => fetchNotifications(true)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
