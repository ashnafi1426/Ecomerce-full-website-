/**
 * MESSAGE STATUS INDICATOR
 * 
 * Shows message delivery status with checkmarks
 * ✓ Sent (single gray checkmark)
 * ✓✓ Delivered (double gray checkmarks)
 * ✓✓ Read (double blue checkmarks)
 * 
 * Only shows for sender's own messages
 * Read status is based on whether OTHER users have read the message
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';

const MessageStatusIndicator = ({ message, conversationParticipants = [] }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Only show status for sender's own messages
  if (!message || message.sender_id !== user?.id) {
    return null;
  }

  // Determine status based on read_by array
  const readBy = message.read_by || [];
  const otherParticipants = conversationParticipants.filter(id => id !== user?.id);
  
  // Check if any other participant has read the message
  const isReadByOthers = otherParticipants.some(participantId => readBy.includes(participantId));
  
  // Determine status
  let status = 'sent';
  if (isReadByOthers) {
    status = 'read';
  } else if (message.delivered_at) {
    status = 'delivered';
  } else if (message.status === 'sending') {
    status = 'sending';
  } else if (message.status === 'failed') {
    status = 'failed';
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
          </div>
        );
      
      case 'sent':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      
      case 'delivered':
        return (
          <div className="flex items-center -space-x-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      
      case 'read':
        return (
          <div className="flex items-center -space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      
      case 'failed':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return `Read${message.read_at ? ` at ${formatTime(message.read_at)}` : ''}`;
      case 'failed':
        return 'Failed to send. Click to retry.';
      default:
        return '';
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div 
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Status Icon */}
      {getStatusIcon()}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
          {getStatusText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageStatusIndicator;
