/**
 * SOCKET.IO CHAT EVENT HANDLERS
 * 
 * Handles real-time chat events and messaging
 */

const chatService = require('../services/chatServices/chat.service');
const notificationService = require('../services/notificationServices/notification.service');
const userService = require('../services/userServices/user.service');

/**
 * Initialize chat event handlers
 * @param {Object} io - Socket.IO server instance
 */
function initializeChatHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Chat] User connected: ${socket.userId} (${socket.userRole})`);

    // Update user online status
    chatService.updateOnlineStatus(socket.userId, true);

    // Join user's personal room for direct messages
    socket.join(`user:${socket.userId}`);

    // ============================================
    // JOIN CONVERSATION
    // ============================================
    socket.on('chat:join', async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const { data: conversation, error } = await require('../config/supabase')
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          return socket.emit('chat:error', { message: 'Conversation not found' });
        }

        if (!conversation.participant_ids.includes(socket.userId)) {
          return socket.emit('chat:error', { message: 'Not authorized' });
        }

        // Join conversation room
        socket.join(`conversation:${conversationId}`);

        // Mark messages as read
        await chatService.markMessagesAsRead(conversationId, socket.userId);

        // Notify others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:user_joined', {
          userId: socket.userId,
          displayName: socket.displayName
        });

        socket.emit('chat:joined', { conversationId });
      } catch (error) {
        console.error('[Chat] Error joining conversation:', error);
        socket.emit('chat:error', { message: 'Failed to join conversation' });
      }
    });

    // ============================================
    // LEAVE CONVERSATION
    // ============================================
    socket.on('chat:leave', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      
      socket.to(`conversation:${conversationId}`).emit('chat:user_left', {
        userId: socket.userId,
        displayName: socket.displayName
      });
    });

    // ============================================
    // SEND MESSAGE
    // ============================================
    socket.on('chat:send_message', async (data) => {
      try {
        const { conversationId, message, attachments, tempId } = data;

        // Verify user is participant
        const { data: conversation, error } = await require('../config/supabase')
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          socket.emit('chat:message_failed', { 
            tempId,
            conversationId,
            message: 'Conversation not found' 
          });
          return;
        }

        if (!conversation.participant_ids.includes(socket.userId)) {
          socket.emit('chat:message_failed', { 
            tempId,
            conversationId,
            message: 'Not authorized' 
          });
          return;
        }

        // Save message to database
        const savedMessage = await chatService.sendMessage(
          conversationId,
          socket.userId,
          message,
          attachments
        );

        // Emit message sent confirmation to sender
        socket.emit('chat:message_sent', {
          ...savedMessage,
          tempId,
          conversation_id: conversationId,
          senderName: socket.displayName,
          senderRole: socket.userRole
        });

        // Broadcast message to other participants in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:new_message', {
          ...savedMessage,
          conversation_id: conversationId,
          senderName: socket.displayName,
          senderRole: socket.userRole
        });

        // Emit delivered status to sender when other participants are online
        const otherParticipants = conversation.participant_ids.filter(
          id => id !== socket.userId
        );

        let deliveredToAny = false;
        for (const participantId of otherParticipants) {
          const status = await chatService.getUserOnlineStatus(participantId);
          if (status.is_online) {
            deliveredToAny = true;
            
            // Emit delivered event to specific user
            io.to(`user:${participantId}`).emit('chat:message_delivered', {
              message_id: savedMessage.id,
              conversation_id: conversationId,
              delivered_at: new Date().toISOString()
            });
          }
        }

        // Emit delivered status to sender
        if (deliveredToAny) {
          socket.emit('chat:message_delivered', {
            message_id: savedMessage.id,
            conversation_id: conversationId,
            delivered_at: new Date().toISOString()
          });
        }

        // Send notification to offline participants
        for (const participantId of otherParticipants) {
          const status = await chatService.getUserOnlineStatus(participantId);
          if (!status.is_online) {
            // Create notification for offline user
            try {
              const senderName = socket.displayName || socket.userEmail || 'Someone';
              
              await notificationService.createNotification({
                user_id: participantId,
                type: 'new_message',
                title: 'New Message',
                message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
                priority: 'medium',
                metadata: {
                  conversation_id: conversationId,
                  message_id: savedMessage.id,
                  sender_id: socket.userId,
                  sender_name: senderName
                },
                action_url: `/messages/${conversationId}`,
                action_text: 'View Message',
                channels: ['in_app']
              });
              
              console.log(`[Chat] ✅ Created notification for offline user ${participantId}`);
            } catch (notifError) {
              console.error(`[Chat] ⚠️ Failed to create notification for user ${participantId}:`, notifError);
            }
          }
        }
      } catch (error) {
        console.error('[Chat] Error sending message:', error);
        socket.emit('chat:message_failed', { 
          tempId: data.tempId,
          conversationId: data.conversationId,
          message: 'Failed to send message' 
        });
      }
    });

    // ============================================
    // TYPING INDICATOR
    // ============================================
    socket.on('chat:typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;

        // Update typing indicator in database
        await chatService.updateTypingIndicator(conversationId, socket.userId, isTyping);

        // Broadcast to others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:user_typing', {
          userId: socket.userId,
          displayName: socket.displayName,
          isTyping
        });
      } catch (error) {
        console.error('[Chat] Error updating typing indicator:', error);
      }
    });

    // ============================================
    // MARK AS READ
    // ============================================
    socket.on('chat:mark_read', async (data) => {
      try {
        const { conversationId } = data;

        await chatService.markMessagesAsRead(conversationId, socket.userId);

        // Get conversation to find other participants
        const { data: conversation } = await require('../config/supabase')
          .from('conversations')
          .select('participant_ids')
          .eq('id', conversationId)
          .single();

        if (conversation) {
          const otherParticipants = conversation.participant_ids.filter(
            id => id !== socket.userId
          );

          // Notify message senders that their messages were read
          for (const participantId of otherParticipants) {
            io.to(`user:${participantId}`).emit('chat:messages_read', {
              userId: socket.userId,
              conversationId,
              read_at: new Date().toISOString()
            });
          }
        }

        // Also broadcast to conversation room
        socket.to(`conversation:${conversationId}`).emit('chat:messages_read', {
          userId: socket.userId,
          conversationId,
          read_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('[Chat] Error marking messages as read:', error);
      }
    });

    // ============================================
    // GET CONVERSATIONS
    // ============================================
    socket.on('chat:get_conversations', async () => {
      try {
        const conversations = await chatService.getUserConversations(socket.userId);
        socket.emit('chat:conversations', conversations);
      } catch (error) {
        console.error('[Chat] Error getting conversations:', error);
        socket.emit('chat:error', { message: 'Failed to get conversations' });
      }
    });

    // ============================================
    // GET MESSAGES
    // ============================================
    socket.on('chat:get_messages', async (data) => {
      try {
        const { conversationId, limit = 50, offset = 0 } = data;

        const messages = await chatService.getMessages(conversationId, limit, offset);
        socket.emit('chat:messages', { conversationId, messages });
      } catch (error) {
        console.error('[Chat] Error getting messages:', error);
        socket.emit('chat:error', { message: 'Failed to get messages' });
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', async () => {
      console.log(`[Chat] User disconnected: ${socket.userId}`);
      
      // Update user online status
      await chatService.updateOnlineStatus(socket.userId, false);

      // Clear typing indicators
      // (handled automatically by database trigger after 10 seconds)
    });

    // ============================================
    // TELEGRAM FEATURES - PHASE 2.1
    // ============================================

    // EDIT MESSAGE
    socket.on('chat:edit_message', async (data) => {
      try {
        const { messageId, newText, conversationId } = data;

        const updatedMessage = await chatService.editMessage(messageId, socket.userId, newText);

        // Emit to sender
        socket.emit('chat:message_edited', {
          ...updatedMessage,
          conversation_id: conversationId
        });

        // Broadcast to others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:message_edited', {
          ...updatedMessage,
          conversation_id: conversationId
        });
      } catch (error) {
        console.error('[Chat] Error editing message:', error);
        socket.emit('chat:error', { 
          message: error.message || 'Failed to edit message',
          action: 'edit_message'
        });
      }
    });

    // DELETE MESSAGE
    socket.on('chat:delete_message', async (data) => {
      try {
        const { messageId, deletionType, conversationId } = data;

        await chatService.deleteMessage(messageId, socket.userId, deletionType || 'for_me');

        // Emit to sender
        socket.emit('chat:message_deleted', {
          message_id: messageId,
          conversation_id: conversationId,
          deletion_type: deletionType
        });

        // If delete for everyone, broadcast to others
        if (deletionType === 'for_everyone') {
          socket.to(`conversation:${conversationId}`).emit('chat:message_deleted', {
            message_id: messageId,
            conversation_id: conversationId,
            deletion_type: deletionType
          });
        }
      } catch (error) {
        console.error('[Chat] Error deleting message:', error);
        socket.emit('chat:error', { 
          message: error.message || 'Failed to delete message',
          action: 'delete_message'
        });
      }
    });

    // ADD REACTION
    socket.on('chat:add_reaction', async (data) => {
      try {
        const { messageId, reaction, conversationId } = data;

        const reactions = await chatService.addReaction(messageId, socket.userId, reaction);

        // Emit to sender
        socket.emit('chat:reaction_added', {
          message_id: messageId,
          conversation_id: conversationId,
          reactions
        });

        // Broadcast to others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:reaction_added', {
          message_id: messageId,
          conversation_id: conversationId,
          reactions,
          user_id: socket.userId
        });
      } catch (error) {
        console.error('[Chat] Error adding reaction:', error);
        socket.emit('chat:error', { 
          message: 'Failed to add reaction',
          action: 'add_reaction'
        });
      }
    });

    // REMOVE REACTION
    socket.on('chat:remove_reaction', async (data) => {
      try {
        const { messageId, reaction, conversationId } = data;

        const reactions = await chatService.removeReaction(messageId, socket.userId, reaction);

        // Emit to sender
        socket.emit('chat:reaction_removed', {
          message_id: messageId,
          conversation_id: conversationId,
          reactions
        });

        // Broadcast to others in conversation
        socket.to(`conversation:${conversationId}`).emit('chat:reaction_removed', {
          message_id: messageId,
          conversation_id: conversationId,
          reactions,
          user_id: socket.userId
        });
      } catch (error) {
        console.error('[Chat] Error removing reaction:', error);
        socket.emit('chat:error', { 
          message: 'Failed to remove reaction',
          action: 'remove_reaction'
        });
      }
    });

    // SEND REPLY (Threading)
    socket.on('chat:send_reply', async (data) => {
      try {
        const { conversationId, message, replyToMessageId, attachments, tempId } = data;

        // Verify user is participant
        const { data: conversation, error } = await require('../config/supabase')
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error || !conversation) {
          socket.emit('chat:message_failed', { 
            tempId,
            conversationId,
            message: 'Conversation not found' 
          });
          return;
        }

        if (!conversation.participant_ids.includes(socket.userId)) {
          socket.emit('chat:message_failed', { 
            tempId,
            conversationId,
            message: 'Not authorized' 
          });
          return;
        }

        // Save reply to database
        const savedMessage = await chatService.sendReply(
          conversationId,
          socket.userId,
          message,
          replyToMessageId,
          attachments
        );

        // Get reply-to message details
        const replyToMessage = await chatService.getMessageDetails(replyToMessageId);

        // Emit reply sent confirmation to sender
        socket.emit('chat:reply_sent', {
          ...savedMessage,
          tempId,
          conversation_id: conversationId,
          reply_to: replyToMessage,
          senderName: socket.displayName,
          senderRole: socket.userRole
        });

        // Broadcast reply to other participants
        socket.to(`conversation:${conversationId}`).emit('chat:new_reply', {
          ...savedMessage,
          conversation_id: conversationId,
          reply_to: replyToMessage,
          senderName: socket.displayName,
          senderRole: socket.userRole
        });

        // Send notifications to offline participants
        const otherParticipants = conversation.participant_ids.filter(
          id => id !== socket.userId
        );

        for (const participantId of otherParticipants) {
          const status = await chatService.getUserOnlineStatus(participantId);
          if (!status.is_online) {
            try {
              const senderName = socket.displayName || socket.userEmail || 'Someone';
              
              await notificationService.createNotification({
                user_id: participantId,
                type: 'new_message',
                title: 'New Reply',
                message: `${senderName} replied: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
                priority: 'medium',
                metadata: {
                  conversation_id: conversationId,
                  message_id: savedMessage.id,
                  reply_to_message_id: replyToMessageId,
                  sender_id: socket.userId,
                  sender_name: senderName
                },
                action_url: `/messages/${conversationId}`,
                action_text: 'View Reply',
                channels: ['in_app', 'email']
              });
            } catch (notifError) {
              console.error(`[Chat] ⚠️ Failed to create reply notification:`, notifError);
            }
          }
        }
      } catch (error) {
        console.error('[Chat] Error sending reply:', error);
        socket.emit('chat:message_failed', { 
          tempId: data.tempId,
          conversationId: data.conversationId,
          message: 'Failed to send reply' 
        });
      }
    });
  });

  console.log('[Chat] Event handlers initialized');
}

module.exports = { initializeChatHandlers };
