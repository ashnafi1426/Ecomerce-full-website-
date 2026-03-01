/**
 * CHAT CONTEXT
 * 
 * Manages chat state, conversations, messages, and real-time events
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import api from '../config/api';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // ============================================
  // FETCH CONVERSATIONS
  // ============================================
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/chat/conversations');
      
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('[Chat] Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // FETCH UNREAD COUNT
  // ============================================
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/chat/unread-count');
      
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('[Chat] Error fetching unread count:', error);
    }
  }, []);

  // ============================================
  // CREATE OR GET CONVERSATION
  // ============================================
  const createConversation = useCallback(async (participantId, metadata = {}) => {
    try {
      const response = await api.post('/chat/conversations', {
        participantId,
        metadata
      });
      
      if (response.success) {
        const conversation = response.data;
        
        // Add to conversations if not exists
        setConversations(prev => {
          const exists = prev.find(c => c.id === conversation.id);
          if (exists) return prev;
          return [conversation, ...prev];
        });
        
        return conversation;
      }
    } catch (error) {
      console.error('[Chat] Error creating conversation:', error);
      throw error;
    }
  }, []);

  // ============================================
  // FETCH MESSAGES
  // ============================================
  const fetchMessages = useCallback(async (conversationId, limit = 50, offset = 0) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { limit, offset }
      });
      
      if (response.success) {
        const fetchedMessages = response.data;
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: fetchedMessages // No need to reverse - already in correct order
        }));
        
        return fetchedMessages;
      }
    } catch (error) {
      console.error('[Chat] Error fetching messages:', error);
      return [];
    }
  }, []);

  // ============================================
  // JOIN CONVERSATION
  // ============================================
  const joinConversation = useCallback((conversationId) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot join - socket not connected');
      return;
    }

    console.log('[Chat] Joining conversation:', conversationId);
    socket.emit('chat:join', { conversationId });
    setActiveConversation(conversationId);
    
    // Fetch messages for this conversation
    fetchMessages(conversationId);
  }, [socket, isConnected, fetchMessages]);

  // ============================================
  // LEAVE CONVERSATION
  // ============================================
  const leaveConversation = useCallback((conversationId) => {
    if (!socket || !isConnected) return;

    console.log('[Chat] Leaving conversation:', conversationId);
    socket.emit('chat:leave', { conversationId });
    
    if (activeConversation === conversationId) {
      setActiveConversation(null);
    }
  }, [socket, isConnected, activeConversation]);

  // ============================================
  // SEND MESSAGE
  // ============================================
  const sendMessage = useCallback((conversationId, message, attachments = null) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot send - socket not connected');
      return;
    }

    // Generate temporary message ID and LOCK IN current timestamp
    const tempId = `temp_${Date.now()}`;
    const currentTime = new Date(); // Capture EXACT current time
    const clientTimestamp = currentTime.toISOString(); // Lock this timestamp
    
    console.log('[Chat] 📤 LOCKING timestamp at:', currentTime.toLocaleTimeString(), '| ISO:', clientTimestamp);
    
    // Add message with 'sending' status - PRESERVE this exact timestamp
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      message_text: message,
      status: 'sending',
      created_at: clientTimestamp, // LOCKED timestamp for display
      client_timestamp: clientTimestamp, // BACKUP - preserve original time
      sender_id: socket.userId,
      _displayTime: clientTimestamp // TRIPLE BACKUP - ensure we never lose this
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [
        ...(prev[conversationId] || []),
        tempMessage
      ]
    }));

    socket.emit('chat:send_message', {
      conversationId,
      message,
      attachments,
      tempId,
      clientTimestamp // Send client timestamp to server
    });
  }, [socket, isConnected]);

  // ============================================
  // SEND TYPING INDICATOR
  // ============================================
  const sendTyping = useCallback((conversationId, isTyping) => {
    if (!socket || !isConnected) return;

    socket.emit('chat:typing', {
      conversationId,
      isTyping
    });
  }, [socket, isConnected]);

  // ============================================
  // MARK AS READ
  // ============================================
  const markAsRead = useCallback((conversationId) => {
    if (!socket || !isConnected) return;

    socket.emit('chat:mark_read', { conversationId });
  }, [socket, isConnected]);

  // ============================================
  // SOCKET EVENT LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Message sent confirmation
    const handleMessageSent = (data) => {
      console.log('[Chat] 📨 Message sent confirmation received');
      console.log('[Chat] Server timestamp (IGNORE THIS):', data.created_at);
      
      // Replace temp message with real message
      // CRITICAL: ALWAYS use the client's original timestamp, NEVER the server's
      setMessages(prev => {
        const currentMessages = prev[data.conversation_id] || [];
        const tempMessage = currentMessages.find(msg => msg.id === data.tempId);
        
        if (tempMessage) {
          // PRIORITY ORDER: Use the LOCKED client timestamp
          const displayTimestamp = tempMessage._displayTime || tempMessage.client_timestamp || tempMessage.created_at;
          console.log('[Chat] ✅ PRESERVING original time:', new Date(displayTimestamp).toLocaleTimeString());
          console.log('[Chat] 🚫 IGNORING server time:', new Date(data.created_at).toLocaleTimeString());
          
          return {
            ...prev,
            [data.conversation_id]: currentMessages.map(msg =>
              msg.id === data.tempId
                ? {
                    ...data,
                    status: 'sent',
                    created_at: displayTimestamp, // FORCE use client timestamp
                    client_timestamp: displayTimestamp, // Preserve backup
                    _displayTime: displayTimestamp, // Triple backup
                    _serverTime: data.created_at // Keep server time for debugging only
                  }
                : msg
            )
          };
        }
        
        console.warn('[Chat] ⚠️ Temp message not found for:', data.tempId);
        return prev;
      });
    };

    // Message delivered
    const handleMessageDelivered = (data) => {
      console.log('[Chat] Message delivered:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.message_id
            ? { ...msg, status: 'delivered', delivered_at: data.delivered_at }
            : msg
        )
      }));
    };

    // Message read
    const handleMessageRead = (data) => {
      console.log('[Chat] Message read:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.message_id
            ? { ...msg, status: 'read', read_at: data.read_at }
            : msg
        )
      }));
    };

    // Message failed
    const handleMessageFailed = (data) => {
      console.log('[Chat] Message failed:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.tempId
            ? { ...msg, status: 'failed' }
            : msg
        )
      }));
    };

    // New message received
    const handleNewMessage = (data) => {
      console.log('[Chat] New message received:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: [
          ...(prev[data.conversation_id] || []),
          { ...data, status: 'delivered' }
        ]
      }));

      // Update conversation's last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === data.conversation_id
            ? { ...conv, last_message_at: data.created_at }
            : conv
        )
      );

      // Update unread count if not active conversation
      if (activeConversation !== data.conversation_id) {
        setUnreadCount(prev => prev + 1);
      } else {
        // Mark as read if active
        markAsRead(data.conversation_id);
      }
    };

    // User typing
    const handleUserTyping = (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.userId]: data.isTyping ? data.displayName : null
      }));

      // Clear typing after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.userId]: null
          }));
        }, 3000);
      }
    };

    // Messages read by other user
    const handleMessagesRead = (data) => {
      console.log('[Chat] Messages read by:', data.userId);
      
      // Update all messages in conversation to 'read' status
      setMessages(prev => ({
        ...prev,
        [data.conversationId]: (prev[data.conversationId] || []).map(msg =>
          msg.sender_id !== data.userId && msg.status !== 'read'
            ? { ...msg, status: 'read', read_at: new Date().toISOString() }
            : msg
        )
      }));
    };

    // Register event listeners
    socket.on('chat:message_sent', handleMessageSent);
    socket.on('chat:message_delivered', handleMessageDelivered);
    socket.on('chat:message_read', handleMessageRead);
    socket.on('chat:message_failed', handleMessageFailed);
    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:user_typing', handleUserTyping);
    socket.on('chat:messages_read', handleMessagesRead);

    // Cleanup
    return () => {
      socket.off('chat:message_sent', handleMessageSent);
      socket.off('chat:message_delivered', handleMessageDelivered);
      socket.off('chat:message_read', handleMessageRead);
      socket.off('chat:message_failed', handleMessageFailed);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:user_typing', handleUserTyping);
      socket.off('chat:messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, activeConversation, markAsRead]);

  // ============================================
  // INITIAL DATA FETCH
  // ============================================
  useEffect(() => {
    if (isConnected) {
      fetchConversations();
      fetchUnreadCount();
    }
  }, [isConnected, fetchConversations, fetchUnreadCount]);

  // ============================================
  // TELEGRAM FEATURES - PHASE 2.1
  // ============================================

  // Edit Message
  const editMessage = useCallback((messageId, newText) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot edit - socket not connected');
      return;
    }

    // Find the conversation ID for this message
    let conversationId = null;
    for (const [convId, msgs] of Object.entries(messages)) {
      if (msgs.find(m => m.id === messageId)) {
        conversationId = convId;
        break;
      }
    }

    if (!conversationId) {
      console.error('[Chat] Cannot find conversation for message');
      return;
    }

    console.log('[Chat] Editing message:', messageId);
    socket.emit('chat:edit_message', {
      messageId,
      newText,
      conversationId
    });
  }, [socket, isConnected, messages]);

  // Delete Message
  const deleteMessage = useCallback((messageId, deletionType, conversationId) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot delete - socket not connected');
      return;
    }

    console.log('[Chat] Deleting message:', messageId, deletionType);
    socket.emit('chat:delete_message', {
      messageId,
      deletionType,
      conversationId
    });
  }, [socket, isConnected]);

  // Add Reaction
  const addReaction = useCallback((messageId, reaction, conversationId) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot add reaction - socket not connected');
      return;
    }

    console.log('[Chat] Adding reaction:', messageId, reaction);
    socket.emit('chat:add_reaction', {
      messageId,
      reaction,
      conversationId
    });
  }, [socket, isConnected]);

  // Remove Reaction
  const removeReaction = useCallback((messageId, reaction, conversationId) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot remove reaction - socket not connected');
      return;
    }

    console.log('[Chat] Removing reaction:', messageId, reaction);
    socket.emit('chat:remove_reaction', {
      messageId,
      reaction,
      conversationId
    });
  }, [socket, isConnected]);

  // Send Reply
  const sendReply = useCallback((conversationId, message, replyToMessageId, attachments = null) => {
    if (!socket || !isConnected) {
      console.warn('[Chat] Cannot send reply - socket not connected');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const currentTime = new Date(); // Capture EXACT current time
    const clientTimestamp = currentTime.toISOString(); // Lock this timestamp
    
    console.log('[Chat] 📤 LOCKING reply timestamp at:', currentTime.toLocaleTimeString(), '| ISO:', clientTimestamp);
    
    // Add temp reply message - PRESERVE this exact timestamp
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      message_text: message,
      reply_to_message_id: replyToMessageId,
      status: 'sending',
      created_at: clientTimestamp, // LOCKED timestamp for display
      client_timestamp: clientTimestamp, // BACKUP - preserve original time
      _displayTime: clientTimestamp, // TRIPLE BACKUP - ensure we never lose this
      sender_id: socket.userId
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [
        ...(prev[conversationId] || []),
        tempMessage
      ]
    }));

    socket.emit('chat:send_reply', {
      conversationId,
      message,
      replyToMessageId,
      attachments,
      tempId,
      clientTimestamp // Send client timestamp to server
    });
  }, [socket, isConnected]);

  // ============================================
  // TELEGRAM FEATURES - SOCKET EVENT LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Message Edited
    const handleMessageEdited = (data) => {
      console.log('[Chat] Message edited:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.id
            ? { ...msg, ...data }
            : msg
        )
      }));
    };

    // Message Deleted
    const handleMessageDeleted = (data) => {
      console.log('[Chat] Message deleted:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.message_id
            ? { ...msg, is_deleted: true, deletion_type: data.deletion_type }
            : msg
        )
      }));
    };

    // Reaction Added
    const handleReactionAdded = (data) => {
      console.log('[Chat] Reaction added:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.message_id
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      }));
    };

    // Reaction Removed
    const handleReactionRemoved = (data) => {
      console.log('[Chat] Reaction removed:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: (prev[data.conversation_id] || []).map(msg =>
          msg.id === data.message_id
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      }));
    };

    // Reply Sent
    const handleReplySent = (data) => {
      console.log('[Chat] 📨 Reply sent confirmation received');
      console.log('[Chat] Server reply timestamp (IGNORE THIS):', data.created_at);
      
      // CRITICAL: ALWAYS use the client's original timestamp, NEVER the server's
      setMessages(prev => {
        const currentMessages = prev[data.conversation_id] || [];
        const tempMessage = currentMessages.find(msg => msg.id === data.tempId);
        
        if (tempMessage) {
          // PRIORITY ORDER: Use the LOCKED client timestamp
          const displayTimestamp = tempMessage._displayTime || tempMessage.client_timestamp || tempMessage.created_at;
          console.log('[Chat] ✅ PRESERVING original reply time:', new Date(displayTimestamp).toLocaleTimeString());
          console.log('[Chat] 🚫 IGNORING server reply time:', new Date(data.created_at).toLocaleTimeString());
          
          return {
            ...prev,
            [data.conversation_id]: currentMessages.map(msg =>
              msg.id === data.tempId
                ? {
                    ...data,
                    status: 'sent',
                    created_at: displayTimestamp, // FORCE use client timestamp
                    client_timestamp: displayTimestamp, // Preserve backup
                    _displayTime: displayTimestamp, // Triple backup
                    _serverTime: data.created_at // Keep server time for debugging only
                  }
                : msg
            )
          };
        }
        
        console.warn('[Chat] ⚠️ Temp reply message not found for:', data.tempId);
        return prev;
      });
    };

    // New Reply Received
    const handleNewReply = (data) => {
      console.log('[Chat] New reply received:', data);
      
      setMessages(prev => ({
        ...prev,
        [data.conversation_id]: [
          ...(prev[data.conversation_id] || []),
          { ...data, status: 'delivered' }
        ]
      }));

      // Update unread count if not active conversation
      if (activeConversation !== data.conversation_id) {
        setUnreadCount(prev => prev + 1);
      } else {
        markAsRead(data.conversation_id);
      }
    };

    // Register Telegram feature event listeners
    socket.on('chat:message_edited', handleMessageEdited);
    socket.on('chat:message_deleted', handleMessageDeleted);
    socket.on('chat:reaction_added', handleReactionAdded);
    socket.on('chat:reaction_removed', handleReactionRemoved);
    socket.on('chat:reply_sent', handleReplySent);
    socket.on('chat:new_reply', handleNewReply);

    // Cleanup
    return () => {
      socket.off('chat:message_edited', handleMessageEdited);
      socket.off('chat:message_deleted', handleMessageDeleted);
      socket.off('chat:reaction_added', handleReactionAdded);
      socket.off('chat:reaction_removed', handleReactionRemoved);
      socket.off('chat:reply_sent', handleReplySent);
      socket.off('chat:new_reply', handleNewReply);
    };
  }, [socket, isConnected, activeConversation, markAsRead]);

  const value = {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    typingUsers,
    isLoading,
    createConversation,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    fetchConversations,
    fetchMessages,
    // Telegram features
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    sendReply
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
