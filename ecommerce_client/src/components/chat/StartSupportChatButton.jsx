/**
 * START SUPPORT CHAT BUTTON
 * 
 * Specialized button for starting chat with customer support.
 * Automatically fetches available support user and creates conversation.
 */

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useChat } from '../../contexts/ChatContext';
import api from '../../config/api';

const StartSupportChatButton = ({ 
  children = '💬 Contact Support',
  className = 'bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors',
  metadata = {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { createConversation, joinConversation } = useChat();

  const handleStartSupportChat = async () => {
    try {
      setIsLoading(true);

      // First, get available support user
      const supportResponse = await api.get('/chat/support-user');
      
      if (!supportResponse.success || !supportResponse.data.supportUserId) {
        toast.error('No support staff available at the moment');
        return;
      }

      const { supportUserId, supportUserName, supportUserRole } = supportResponse.data;

      // Create or get conversation with support user
      const conversation = await createConversation(supportUserId, {
        ...metadata,
        type: 'customer_support',
        recipientName: supportUserName,
        recipientRole: supportUserRole
      });

      // Join the conversation
      joinConversation(conversation.id);

      toast.success(`Chat started with ${supportUserName}`);
    } catch (error) {
      console.error('[StartSupportChatButton] Error:', error);
      
      if (error.message.includes('No support staff available')) {
        toast.error('No support staff available at the moment. Please try again later.');
      } else {
        toast.error('Failed to start support chat. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartSupportChat}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? '⏳ Connecting...' : children}
    </button>
  );
};

export default StartSupportChatButton;