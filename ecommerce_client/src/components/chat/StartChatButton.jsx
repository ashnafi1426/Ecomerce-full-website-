/**
 * START CHAT BUTTON
 * 
 * Button to initiate a chat with a specific user (seller, support, etc.)
 */

import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

const StartChatButton = ({ 
  recipientId, 
  recipientName, 
  recipientRole,
  metadata = {},
  className = '',
  children 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { createConversation, joinConversation } = useChat();
  const { user } = useSelector((state) => state.auth);

  const handleStartChat = async () => {
    if (!user) {
      toast.error('Please login to start a chat');
      return;
    }

    if (!recipientId) {
      toast.error('Invalid recipient');
      return;
    }

    try {
      setIsLoading(true);

      // Create or get conversation
      const conversation = await createConversation(recipientId, {
        ...metadata,
        recipientName,
        recipientRole
      });

      // Join the conversation
      joinConversation(conversation.id);

      toast.success(`Chat started with ${recipientName}`);
    } catch (error) {
      console.error('[StartChatButton] Error:', error);
      toast.error('Failed to start chat');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={isLoading}
      className={`inline-flex items-center space-x-2 ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Starting...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{children || 'Chat'}</span>
        </>
      )}
    </button>
  );
};

export default StartChatButton;
