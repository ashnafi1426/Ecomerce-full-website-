/**
 * CHAT SERVICE
 * 
 * Handles all database operations for the live chat system
 */

const supabase = require('../../config/supabase');

class ChatService {
  /**
   * Create a new conversation
   */
  async createConversation(type, participantIds, metadata = {}) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type,
          participant_ids: participantIds, // Fixed: use participant_ids to match schema
          metadata,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ChatService] Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Find existing conversation between participants
   */
  async findConversation(participantIds) {
    try {
      // Get all conversations and filter client-side
      // This is more reliable than JSONB operators which can be tricky
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Find conversation with exact participant match
      const conversation = (conversations || []).find(conv => {
        const convParticipants = conv.participant_ids || [];
        return convParticipants.length === participantIds.length &&
               participantIds.every(id => convParticipants.includes(id));
      });

      return conversation || null;
    } catch (error) {
      console.error('[ChatService] Error finding conversation:', error);
      return null;
    }
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(type, participantIds, metadata = {}) {
    try {
      // Try to find existing conversation
      let conversation = await this.findConversation(participantIds);

      // Create new if doesn't exist
      if (!conversation) {
        conversation = await this.createConversation(type, participantIds, metadata);
      }

      return conversation;
    } catch (error) {
      console.error('[ChatService] Error in getOrCreateConversation:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId, limit = 50) {
    try {
      // Get all conversations and filter client-side
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(limit * 2); // Get more to account for filtering

      if (error) throw error;

      // Filter conversations where user is a participant
      const userConversations = (conversations || []).filter(conv => {
        const participants = conv.participant_ids || [];
        return participants.includes(userId);
      }).slice(0, limit); // Limit after filtering

      return userConversations;
    } catch (error) {
      console.error('[ChatService] Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, senderId, messageText, attachments = null) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          message_text: messageText,
          attachments,
          read_by: [senderId] // Sender has read their own message
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('[ChatService] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }) // Changed to ascending for correct order
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ChatService] Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId, userId) {
    try {
      // Get all messages in conversation
      const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('id, read_by')
        .eq('conversation_id', conversationId);

      if (fetchError) throw fetchError;

      // Filter messages not read by this user (client-side filtering)
      const unreadMessages = (messages || []).filter(msg => {
        const readBy = msg.read_by || [];
        return !readBy.includes(userId);
      });

      // Update each unread message
      for (const message of unreadMessages) {
        const updatedReadBy = [...(message.read_by || []), userId];
        
        await supabase
          .from('messages')
          .update({ read_by: updatedReadBy })
          .eq('id', message.id);
      }

      return { success: true, count: unreadMessages.length };
    } catch (error) {
      console.error('[ChatService] Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId) {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_message_count', { user_id: userId });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('[ChatService] Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Update typing indicator
   */
  async updateTypingIndicator(conversationId, userId, isTyping) {
    try {
      if (isTyping) {
        // Insert or update typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: userId,
            is_typing: true,
            last_typed_at: new Date().toISOString()
          });

        if (error) throw error;
      } else {
        // Remove typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('[ChatService] Error updating typing indicator:', error);
      throw error;
    }
  }

  /**
   * Get typing users in conversation
   */
  async getTypingUsers(conversationId) {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('is_typing', true);

      if (error) throw error;
      return (data || []).map(row => row.user_id);
    } catch (error) {
      console.error('[ChatService] Error getting typing users:', error);
      return [];
    }
  }

  /**
   * Update user online status
   */
  async updateOnlineStatus(userId, isOnline) {
    try {
      const { error } = await supabase
        .from('user_online_status')
        .upsert({
          user_id: userId,
          is_online: isOnline,
          last_seen_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[ChatService] Error updating online status:', error);
      throw error;
    }
  }

  /**
   * Get user online status
   */
  async getUserOnlineStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('user_online_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || { is_online: false };
    } catch (error) {
      console.error('[ChatService] Error getting online status:', error);
      return { is_online: false };
    }
  }

  // =====================================================
  // TELEGRAM FEATURES - PHASE 2.1
  // =====================================================

  /**
   * Edit a message
   */
  async editMessage(messageId, userId, newText) {
    try {
      const { data, error } = await supabase
        .rpc('edit_message', {
          p_message_id: messageId,
          p_user_id: userId,
          p_new_text: newText
        });

      if (error) throw error;
      
      // Get updated message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;
      return message;
    } catch (error) {
      console.error('[ChatService] Error editing message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId, userId, deletionType = 'for_me') {
    try {
      const { data, error } = await supabase
        .rpc('delete_message', {
          p_message_id: messageId,
          p_user_id: userId,
          p_deletion_type: deletionType
        });

      if (error) throw error;
      return { success: true, deletionType };
    } catch (error) {
      console.error('[ChatService] Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId, userId, reaction) {
    try {
      const { data, error } = await supabase
        .rpc('add_message_reaction', {
          p_message_id: messageId,
          p_user_id: userId,
          p_reaction: reaction
        });

      if (error) throw error;
      
      // Get updated reactions for this message
      const reactions = await this.getMessageReactions(messageId);
      return reactions;
    } catch (error) {
      console.error('[ChatService] Error adding reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from message
   */
  async removeReaction(messageId, userId, reaction) {
    try {
      const { data, error } = await supabase
        .rpc('remove_message_reaction', {
          p_message_id: messageId,
          p_user_id: userId,
          p_reaction: reaction
        });

      if (error) throw error;
      
      // Get updated reactions for this message
      const reactions = await this.getMessageReactions(messageId);
      return reactions;
    } catch (error) {
      console.error('[ChatService] Error removing reaction:', error);
      throw error;
    }
  }

  /**
   * Get reactions for a message
   */
  async getMessageReactions(messageId) {
    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

      if (error) throw error;

      // Group reactions by emoji
      const grouped = {};
      (data || []).forEach(reaction => {
        if (!grouped[reaction.reaction]) {
          grouped[reaction.reaction] = {
            reaction: reaction.reaction,
            count: 0,
            user_ids: []
          };
        }
        grouped[reaction.reaction].count++;
        grouped[reaction.reaction].user_ids.push(reaction.user_id);
      });

      return Object.values(grouped);
    } catch (error) {
      console.error('[ChatService] Error getting reactions:', error);
      return [];
    }
  }

  /**
   * Get message edit history
   */
  async getMessageEditHistory(messageId) {
    try {
      const { data, error } = await supabase
        .from('message_edits')
        .select('*')
        .eq('message_id', messageId)
        .order('edited_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[ChatService] Error getting edit history:', error);
      return [];
    }
  }

  /**
   * Send reply to a message (threading)
   */
  async sendReply(conversationId, userId, messageText, replyToMessageId, attachments = null) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          message_text: messageText,
          reply_to_message_id: replyToMessageId,
          attachments,
          read_by: [userId]
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('[ChatService] Error sending reply:', error);
      throw error;
    }
  }

  /**
   * Get message with full details (reactions, reply info, etc.)
   */
  async getMessageDetails(messageId) {
    try {
      // Get message
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (msgError) throw msgError;

      // Get reactions
      const reactions = await this.getMessageReactions(messageId);

      // Get reply-to message if exists
      let replyToMessage = null;
      if (message.reply_to_message_id) {
        const { data: replyMsg, error: replyError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', message.reply_to_message_id)
          .single();

        if (!replyError) {
          replyToMessage = replyMsg;
        }
      }

      // Get edit history if edited
      let editHistory = [];
      if (message.is_edited) {
        editHistory = await this.getMessageEditHistory(messageId);
      }

      return {
        ...message,
        reactions,
        reply_to: replyToMessage,
        edit_history: editHistory
      };
    } catch (error) {
      console.error('[ChatService] Error getting message details:', error);
      throw error;
    }
  }

  /**
   * Get messages with enhanced data (reactions, replies, etc.)
   */
  async getMessagesEnhanced(conversationId, limit = 50, offset = 0) {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true }) // Changed to ascending for correct order
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Enhance each message with reactions and reply info
      const enhancedMessages = await Promise.all(
        (messages || []).map(async (msg) => {
          const reactions = await this.getMessageReactions(msg.id);
          
          let replyToMessage = null;
          if (msg.reply_to_message_id) {
            const { data: replyMsg } = await supabase
              .from('messages')
              .select('id, message_text, sender_id, created_at')
              .eq('id', msg.reply_to_message_id)
              .single();
            
            replyToMessage = replyMsg;
          }

          return {
            ...msg,
            reactions,
            reply_to: replyToMessage
          };
        })
      );

      return enhancedMessages;
    } catch (error) {
      console.error('[ChatService] Error getting enhanced messages:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
