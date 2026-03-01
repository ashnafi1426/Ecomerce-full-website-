/**
 * TIME FORMATTING UTILITIES
 * 
 * Telegram-style time formatting for chat messages and conversations
 */

/**
 * Format time in Telegram style: "3h ago", "Yesterday", "12:45 PM", "Jan 15"
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // Calculate differences
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Just now (< 1 minute)
  if (diffMins < 1) {
    return 'Just now';
  }
  
  // Minutes ago (< 1 hour)
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  
  // Hours ago (< 24 hours)
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // This week (< 7 days)
  if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }
  
  // This year (show month and day)
  if (date.getFullYear() === now.getFullYear()) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
  
  // Previous years (show full date)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Format message time (for individual messages in thread)
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string (e.g., "12:45 PM")
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  // Handle both ISO strings and Date objects
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('[TimeFormat] Invalid timestamp:', timestamp);
    return '';
  }
  
  // Use local time formatting to show the actual current time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert to 12-hour format
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

/**
 * Format last seen time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted last seen string
 */
export const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'last seen recently';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) {
    return 'last seen just now';
  }
  
  if (diffMins < 60) {
    return `last seen ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  
  if (diffHours < 24) {
    return `last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `last seen yesterday at ${formatMessageTime(timestamp)}`;
  }
  
  return `last seen ${formatTimeAgo(timestamp)}`;
};

/**
 * Check if timestamp is today
 * @param {string|Date} timestamp - The timestamp to check
 * @returns {boolean} True if timestamp is today
 */
export const isToday = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if timestamp is yesterday
 * @param {string|Date} timestamp - The timestamp to check
 * @returns {boolean} True if timestamp is yesterday
 */
export const isYesterday = (timestamp) => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

/**
 * Format full date and time
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date and time
 */
export const formatFullDateTime = (timestamp) => {
  if (!timestamp) return '';
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
