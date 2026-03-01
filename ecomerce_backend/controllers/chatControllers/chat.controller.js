/**
 * CHAT CONTROLLER
 * 
 * REST API endpoints for chat operations
 */

const chatService = require('../../services/chatServices/chat.service');
const userService = require('../../services/userServices/user.service');
const notificationService = require('../../services/notificationServices/notification.service');

class ChatController {
  /**
   * Create or get conversation
   * POST /api/chat/conversations
   */
  async createConversation(req, res, next) {
    try {
      const { participantId, type, metadata } = req.body;
      const currentUserId = req.user.id;

      if (!participantId) {
        return res.status(400).json({
          success: false,
          message: 'Participant ID is required'
        });
      }

      // Verify participant exists
      const participant = await userService.findById(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'Participant not found'
        });
      }

      // Determine conversation type if not provided
      let conversationType = type;
      if (!conversationType) {
        if (req.user.role === 'customer' && participant.role === 'seller') {
          conversationType = 'customer_seller';
        } else if (req.user.role === 'customer' && ['admin', 'manager'].includes(participant.role)) {
          conversationType = 'customer_support';
        } else if (req.user.role === 'seller' && ['admin', 'manager'].includes(participant.role)) {
          conversationType = 'seller_support';
        } else {
          conversationType = 'internal';
        }
      }

      // Get or create conversation
      const participantIds = [currentUserId, participantId].sort();
      const conversation = await chatService.getOrCreateConversation(
        conversationType,
        participantIds,
        metadata || {}
      );

      res.status(200).json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('[ChatController] Error creating conversation:', error);
      next(error);
    }
  }

  /**
   * Get user's conversations
   * GET /api/chat/conversations
   */
  async getConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;

      const conversations = await chatService.getUserConversations(userId, limit);

      // Enrich with participant info
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const otherParticipantIds = conv.participant_ids.filter(id => id !== userId); // Fixed: use participant_ids
          const participants = await Promise.all(
            otherParticipantIds.map(id => userService.findById(id))
          );

          return {
            ...conv,
            participantDetails: participants.map(p => ({
              id: p.id,
              displayName: p.display_name,
              email: p.email,
              role: p.role
            }))
          };
        })
      );

      res.status(200).json({
        success: true,
        data: enrichedConversations
      });
    } catch (error) {
      console.error('[ChatController] Error getting conversations:', error);
      next(error);
    }
  }

  /**
   * Get conversation messages
   * GET /api/chat/conversations/:conversationId/messages
   */
  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // Verify user is participant
      const { data: conversation, error } = await require('../../config/supabase')
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      if (!conversation.participant_ids.includes(userId)) { // Fixed: use participant_ids
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this conversation'
        });
      }

      const messages = await chatService.getMessages(conversationId, limit, offset);

      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('[ChatController] Error getting messages:', error);
      next(error);
    }
  }

  /**
   * Send message (REST API fallback)
   * POST /api/chat/conversations/:conversationId/messages
   */
  async sendMessage(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { message, attachments } = req.body;
      const userId = req.user.id;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message text is required'
        });
      }

      // Verify user is participant
      const { data: conversation, error } = await require('../../config/supabase')
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      if (!conversation.participant_ids.includes(userId)) { // Fixed: use participant_ids
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send messages in this conversation'
        });
      }

      const savedMessage = await chatService.sendMessage(
        conversationId,
        userId,
        message,
        attachments
      );

      // Create notifications for other participants
      try {
        const recipientIds = conversation.participant_ids.filter(id => id !== userId);
        
        // Get sender info for notification
        const sender = await userService.findById(userId);
        const senderName = sender?.display_name || sender?.email || 'Someone';
        
        // Create notification for each recipient (both in-app and email)
        for (const recipientId of recipientIds) {
          await notificationService.createNotification({
            user_id: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            priority: 'medium',
            metadata: {
              conversation_id: conversationId,
              message_id: savedMessage.id,
              sender_id: userId,
              sender_name: senderName
            },
            action_url: `/messages/${conversationId}`,
            action_text: 'View Message',
            channels: ['in_app', 'email']  // Send both in-app and email notifications
          });
        }
        
        console.log(`[Chat] ✅ Created in-app and email notifications for ${recipientIds.length} recipient(s)`);
      } catch (notifError) {
        console.error('[Chat] ⚠️ Failed to create message notifications (non-critical):', notifError);
        // Don't throw - notification failure shouldn't break message sending
      }

      res.status(201).json({
        success: true,
        data: savedMessage
      });
    } catch (error) {
      console.error('[ChatController] Error sending message:', error);
      next(error);
    }
  }

  /**
   * Mark messages as read
   * POST /api/chat/conversations/:conversationId/read
   */
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const result = await chatService.markMessagesAsRead(conversationId, userId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[ChatController] Error marking as read:', error);
      next(error);
    }
  }

  /**
   * Get unread message count
   * GET /api/chat/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await chatService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('[ChatController] Error getting unread count:', error);
      next(error);
    }
  }

  /**
   * Get user online status
   * GET /api/chat/users/:userId/status
   */
  async getUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const status = await chatService.getUserOnlineStatus(userId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('[ChatController] Error getting user status:', error);
      next(error);
    }
  }

  // =====================================================
  // TELEGRAM FEATURES - PHASE 2.1
  // =====================================================

  /**
   * Edit a message
   * PUT /api/chat/messages/:messageId
   */
  async editMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message text is required'
        });
      }

      const updatedMessage = await chatService.editMessage(messageId, userId, message);

      res.status(200).json({
        success: true,
        data: updatedMessage
      });
    } catch (error) {
      console.error('[ChatController] Error editing message:', error);
      if (error.message.includes('Only message sender')) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own messages'
        });
      }
      next(error);
    }
  }

  /**
   * Delete a message
   * DELETE /api/chat/messages/:messageId
   */
  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const { deletionType } = req.body; // 'for_me' or 'for_everyone'
      const userId = req.user.id;

      const result = await chatService.deleteMessage(
        messageId, 
        userId, 
        deletionType || 'for_me'
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[ChatController] Error deleting message:', error);
      if (error.message.includes('Only message sender')) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete for everyone your own messages'
        });
      }
      next(error);
    }
  }

  /**
   * Add reaction to message
   * POST /api/chat/messages/:messageId/reactions
   */
  async addReaction(req, res, next) {
    try {
      const { messageId } = req.params;
      const { reaction } = req.body;
      const userId = req.user.id;

      if (!reaction) {
        return res.status(400).json({
          success: false,
          message: 'Reaction is required'
        });
      }

      const reactions = await chatService.addReaction(messageId, userId, reaction);

      res.status(200).json({
        success: true,
        data: reactions
      });
    } catch (error) {
      console.error('[ChatController] Error adding reaction:', error);
      next(error);
    }
  }

  /**
   * Remove reaction from message
   * DELETE /api/chat/messages/:messageId/reactions/:reaction
   */
  async removeReaction(req, res, next) {
    try {
      const { messageId, reaction } = req.params;
      const userId = req.user.id;

      const reactions = await chatService.removeReaction(messageId, userId, reaction);

      res.status(200).json({
        success: true,
        data: reactions
      });
    } catch (error) {
      console.error('[ChatController] Error removing reaction:', error);
      next(error);
    }
  }

  /**
   * Get message reactions
   * GET /api/chat/messages/:messageId/reactions
   */
  async getReactions(req, res, next) {
    try {
      const { messageId } = req.params;
      const reactions = await chatService.getMessageReactions(messageId);

      res.status(200).json({
        success: true,
        data: reactions
      });
    } catch (error) {
      console.error('[ChatController] Error getting reactions:', error);
      next(error);
    }
  }

  /**
   * Get message edit history
   * GET /api/chat/messages/:messageId/history
   */
  async getEditHistory(req, res, next) {
    try {
      const { messageId } = req.params;
      const history = await chatService.getMessageEditHistory(messageId);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('[ChatController] Error getting edit history:', error);
      next(error);
    }
  }

  /**
   * Send reply to a message
   * POST /api/chat/conversations/:conversationId/messages/reply
   */
  async sendReply(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { message, replyToMessageId, attachments } = req.body;
      const userId = req.user.id;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message text is required'
        });
      }

      if (!replyToMessageId) {
        return res.status(400).json({
          success: false,
          message: 'Reply to message ID is required'
        });
      }

      // Verify user is participant
      const { data: conversation, error } = await require('../../config/supabase')
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      if (!conversation.participant_ids.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send messages in this conversation'
        });
      }

      const savedMessage = await chatService.sendReply(
        conversationId,
        userId,
        message,
        replyToMessageId,
        attachments
      );

      // Create notifications for other participants
      try {
        const recipientIds = conversation.participant_ids.filter(id => id !== userId);
        const sender = await userService.findById(userId);
        const senderName = sender?.display_name || sender?.email || 'Someone';
        
        for (const recipientId of recipientIds) {
          await notificationService.createNotification({
            user_id: recipientId,
            type: 'new_message',
            title: 'New Reply',
            message: `${senderName} replied: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            priority: 'medium',
            metadata: {
              conversation_id: conversationId,
              message_id: savedMessage.id,
              reply_to_message_id: replyToMessageId,
              sender_id: userId,
              sender_name: senderName
            },
            action_url: `/messages/${conversationId}`,
            action_text: 'View Reply',
            channels: ['in_app', 'email']
          });
        }
      } catch (notifError) {
        console.error('[Chat] ⚠️ Failed to create reply notifications:', notifError);
      }

      res.status(201).json({
        success: true,
        data: savedMessage
      });
    } catch (error) {
      console.error('[ChatController] Error sending reply:', error);
      next(error);
    }
  }

  /**
   * Get message details with reactions and reply info
   * GET /api/chat/messages/:messageId/details
   */
  async getMessageDetails(req, res, next) {
    try {
      const { messageId } = req.params;
      const details = await chatService.getMessageDetails(messageId);

      res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('[ChatController] Error getting message details:', error);
      next(error);
    }
  }

  /**
   * Upload files for chat
   * POST /api/chat/upload
   */
  async uploadFiles(req, res, next) {
    try {
      const userId = req.user.id;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided'
        });
      }

      // Import file upload service
      const fileUploadService = require('../../services/chatServices/file-upload.service');

      // Upload files
      const result = await fileUploadService.uploadMultipleFiles(files, userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload files',
          error: result.error
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('[ChatController] Error uploading files:', error);
      next(error);
    }
  }

  /**
   * Get support user for starting support chat
   * GET /api/chat/support-user
   */
  async getSupportUser(req, res, next) {
    try {
      // Find an available admin or manager user using Supabase
      const supabase = require('../../config/supabase');
      
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, display_name, role')
        .in('role', ['admin', 'manager'])
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('[ChatController] Database error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch support user'
        });
      }

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No support staff available at the moment'
        });
      }

      const supportUser = users[0];

      res.status(200).json({
        success: true,
        data: {
          supportUserId: supportUser.id,
          supportUserName: supportUser.display_name || supportUser.email,
          supportUserRole: supportUser.role
        }
      });
    } catch (error) {
      console.error('[ChatController] Error getting support user:', error);
      next(error);
    }
  }
}

module.exports = new ChatController();

