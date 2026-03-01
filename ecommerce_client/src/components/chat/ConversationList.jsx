/**
 * CONVERSATION LIST
 * 
 * Displays list of user's conversations with search functionality
 * Shows message preview like Telegram
 */

import { useEffect, useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSelector } from 'react-redux';
import { formatTimeAgo } from '../../utils/timeFormat';
import UserProfileModal from './UserProfileModal';

const ConversationList = ({ onSelectConversation }) => {
  const { conversations, messages, isLoading, fetchConversations, joinConversation, createConversation } = useChat();
  const { user } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [profileModal, setProfileModal] = useState({ isOpen: false, userId: null });

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conversation) => {
      const participant = conversation.participantDetails?.[0];
      const displayName = participant?.displayName?.toLowerCase() || '';
      const role = participant?.role?.toLowerCase() || '';
      const type = conversation.type?.toLowerCase() || '';
      
      return (
        displayName.includes(query) ||
        role.includes(query) ||
        type.includes(query)
      );
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const handleSelectConversation = (conversation) => {
    joinConversation(conversation.id);
    onSelectConversation(conversation);
  };

  const handleViewProfile = (e, userId) => {
    e.stopPropagation(); // Prevent conversation selection
    setProfileModal({ isOpen: true, userId });
  };

  const handleStartChatFromProfile = async (targetUser) => {
    try {
      console.log('[ConversationList] Starting chat with user:', targetUser);
      
      // Create or get existing conversation with this user
      const conversation = await createConversation(targetUser.id);
      
      if (conversation) {
        console.log('[ConversationList] Conversation created/found:', conversation);
        
        // Select the conversation to open it
        handleSelectConversation(conversation);
      }
    } catch (error) {
      console.error('[ConversationList] Error starting chat:', error);
    } finally {
      // Close the profile modal
      setProfileModal({ isOpen: false, userId: null });
    }
  };

  const formatTime = (conversation) => {
    // Use last_message_at from conversation if available
    const timestamp = conversation.last_message_at || conversation.updated_at || conversation.created_at;
    return formatTimeAgo(timestamp);
  };

  // Get last message for conversation
  const getLastMessage = (conversationId) => {
    const conversationMessages = messages[conversationId] || [];
    if (conversationMessages.length === 0) return null;
    return conversationMessages[conversationMessages.length - 1];
  };

  const formatMessagePreview = (conversation) => {
    // First try to use cached last_message_text from conversation
    if (conversation.last_message_text) {
      const maxLength = 50;
      const text = conversation.last_message_text;
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Fallback to messages array
    const lastMessage = getLastMessage(conversation.id);
    if (!lastMessage) return 'No messages yet';
    
    // Handle deleted messages
    if (lastMessage.is_deleted) {
      return lastMessage.deletion_type === 'for_everyone' 
        ? '🚫 This message was deleted' 
        : '🚫 You deleted this message';
    }

    // Handle file attachments
    if (lastMessage.attachments && lastMessage.attachments.length > 0) {
      const attachment = lastMessage.attachments[0];
      if (attachment.type?.startsWith('image/')) {
        return '📷 Photo';
      } else if (attachment.type?.startsWith('video/')) {
        return '🎥 Video';
      } else if (attachment.type?.includes('pdf')) {
        return '📄 PDF';
      } else {
        return '📎 File';
      }
    }

    // Handle text message
    if (lastMessage.message_text) {
      const maxLength = 50;
      const text = lastMessage.message_text;
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    return 'Message';
  };

  // Get unread count for conversation
  const getUnreadCount = (conversation) => {
    const conversationMessages = messages[conversation.id] || [];
    if (!user) return 0;
    
    return conversationMessages.filter(msg => {
      const readBy = msg.read_by || [];
      return msg.sender_id !== user.id && !readBy.includes(user.id);
    }).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-center">No conversations yet</p>
        <p className="text-sm text-center mt-2">Start chatting with sellers or support</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            aria-label="Search conversations"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-center font-medium">No results found</p>
            <p className="text-sm text-center mt-2">Try searching for a different name or role</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const participant = conversation.participantDetails?.[0];
            const lastMessage = getLastMessage(conversation.id);
            const unreadCount = getUnreadCount(conversation);
            const isOwnMessage = lastMessage?.sender_id === user?.id;
            
            return (
              <button
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className="w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors text-left flex items-start space-x-3"
              >
                {/* Avatar */}
                <div 
                  className="flex-shrink-0 relative cursor-pointer"
                  onClick={(e) => handleViewProfile(e, participant?.id)}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold hover:bg-blue-200 transition-colors">
                    {participant?.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {/* Online indicator */}
                  {participant?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 
                      className="font-semibold text-gray-900 truncate hover:text-blue-600 cursor-pointer"
                      onClick={(e) => handleViewProfile(e, participant?.id)}
                    >
                      {participant?.displayName || 'Unknown User'}
                    </h4>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conversation)}
                    </span>
                  </div>
                  
                  {/* Role Badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                      {participant?.role || 'User'}
                    </span>
                  </div>

                  {/* Message Preview */}
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate flex-1 ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {isOwnMessage && lastMessage && (
                        <span className="mr-1 text-blue-600">
                          {lastMessage.status === 'read' ? '✓✓' : '✓'}
                        </span>
                      )}
                      {formatMessagePreview(conversation)}
                    </p>
                    
                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModal.isOpen}
        onClose={() => setProfileModal({ isOpen: false, userId: null })}
        userId={profileModal.userId}
        onStartChat={handleStartChatFromProfile}
      />
    </div>
  );
};

export default ConversationList;
