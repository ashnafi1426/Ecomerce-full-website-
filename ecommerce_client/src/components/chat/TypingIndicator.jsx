/**
 * TYPING INDICATOR
 * 
 * Shows when other users are typing
 */

import React from 'react';
import { useChat } from '../../contexts/ChatContext';

const TypingIndicator = ({ conversationId }) => {
  const { typingUsers } = useChat();

  // Get typing users (filter out null values)
  const activeTypingUsers = Object.entries(typingUsers)
    .filter(([_, name]) => name !== null)
    .map(([_, name]) => name);

  if (activeTypingUsers.length === 0) return null;

  return (
    <div className="px-4 py-2 text-sm text-gray-500 italic">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <span>
          {activeTypingUsers.length === 1
            ? `${activeTypingUsers[0]} is typing...`
            : `${activeTypingUsers.length} people are typing...`}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;
