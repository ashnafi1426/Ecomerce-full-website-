/**
 * MESSAGE THREAD
 * 
 * Displays messages in a conversation with status indicators, file attachments,
 * reactions, replies, edit/delete functionality
 */

import { useEffect, useRef, useState, memo, useMemo } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useSelector } from 'react-redux';
import { formatMessageTime } from '../../utils/timeFormat';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import MessageStatusIndicator from './MessageStatusIndicator';
import FileAttachment from './FileAttachment';
import MessageActions from './MessageActions';
import EmojiPicker from './EmojiPicker';
import ReactionList from './ReactionList';
import ReplyPreview from './ReplyPreview';
import EditedIndicator from './EditedIndicator';
import DeleteConfirmModal from './DeleteConfirmModal';
import EditHistoryModal from './EditHistoryModal';
import './MessageThread.css';

// Memoized Message Bubble Component - prevents re-renders of existing messages
const MessageBubble = memo(({ 
  message, 
  isOwnMessage, 
  user,
  conversation,
  formatTime,
  showActionsFor,
  setShowActionsFor,
  showEmojiPickerFor,
  setShowEmojiPickerFor,
  handleEdit,
  handleDelete,
  handleReply,
  handleReact,
  handleEmojiSelect,
  handleRemoveReaction,
  handleViewHistory
}) => {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const isDeleted = message.is_deleted;

  return (
    <div
      className={`message-wrapper ${isOwnMessage ? 'sent' : 'received'}`}
    >
      <div
        className={`message-bubble ${isOwnMessage ? 'sent' : 'received'} ${isDeleted ? 'deleted' : ''} relative group`}
      >
        {/* Reply Context */}
        {message.reply_to && (
          <div className="mb-2">
            <ReplyPreview replyTo={message.reply_to} compact={true} />
          </div>
        )}

        {/* Message Text */}
        {isDeleted ? (
          <p className="text-sm italic opacity-70">
            {message.deletion_type === 'for_everyone' 
              ? 'This message was deleted' 
              : 'You deleted this message'}
          </p>
        ) : (
          <>
            {message.message_text && (
              <p className="text-sm break-words">{message.message_text}</p>
            )}

            {/* File Attachments */}
            {hasAttachments && (
              <div className="space-y-2 mt-2">
                {message.attachments.map((attachment, index) => (
                  <FileAttachment
                    key={index}
                    attachment={attachment}
                    isOwnMessage={isOwnMessage}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        {!isDeleted && message.reactions && message.reactions.length > 0 && (
          <ReactionList
            reactions={message.reactions}
            messageId={message.id}
            onReactionClick={handleEmojiSelect}
            onRemoveReaction={handleRemoveReaction}
          />
        )}

        {/* Timestamp, Status, and Edited Indicator */}
        <div
          className={`flex items-center justify-between gap-2 mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="text-xs">
              {formatTime(message.created_at)}
            </span>
            {!isDeleted && message.is_edited && (
              <EditedIndicator 
                message={message} 
                onViewHistory={() => handleViewHistory(message)}
              />
            )}
          </div>
          {!isDeleted && (
            <MessageStatusIndicator 
              message={message}
              conversationParticipants={conversation.participant_ids || []}
            />
          )}
        </div>

        {/* Message Actions Menu - Always Visible Three-Dot Button */}
        {!isDeleted && (
          <button
            onClick={() => setShowActionsFor(showActionsFor === message.id ? null : message.id)}
            className="message-actions-trigger"
            title="Message actions"
            style={{
              position: 'absolute',
              top: '4px',
              right: isOwnMessage ? 'auto' : '-36px',
              left: isOwnMessage ? '-36px' : 'auto',
              padding: '6px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '50%',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px'
            }}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
        
        {/* Message Actions Dropdown */}
        {!isDeleted && showActionsFor === message.id && (
          <div style={{ position: 'absolute', top: '0', right: isOwnMessage ? 'auto' : '-36px', left: isOwnMessage ? '-36px' : 'auto', zIndex: 20 }}>
            <MessageActions
              message={message}
              isOwnMessage={isOwnMessage}
              onEdit={() => handleEdit(message)}
              onDelete={() => handleDelete(message)}
              onReply={() => handleReply(message)}
              onReact={() => handleReact(message.id)}
              onClose={() => setShowActionsFor(null)}
            />
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPickerFor === message.id && (
          <div className="absolute top-full right-0 z-50">
            <EmojiPicker
              onSelectEmoji={(emoji) => handleEmojiSelect(message.id, emoji)}
              onClose={() => setShowEmojiPickerFor(null)}
              position="top"
            />
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if these specific props change
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.message_text === nextProps.message.message_text &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.is_edited === nextProps.message.is_edited &&
    prevProps.message.is_deleted === nextProps.message.is_deleted &&
    prevProps.showActionsFor === nextProps.showActionsFor &&
    prevProps.showEmojiPickerFor === nextProps.showEmojiPickerFor &&
    JSON.stringify(prevProps.message.reactions) === JSON.stringify(nextProps.message.reactions)
  );
});

MessageBubble.displayName = 'MessageBubble';

const MessageThread = ({ conversation }) => {
  const { messages, fetchMessages, markAsRead, addReaction, removeReaction, deleteMessage } = useChat();
  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  
  // Memoize messages array to prevent unnecessary re-renders
  const conversationMessages = useMemo(() => {
    return messages[conversation.id] || [];
  }, [messages, conversation.id]);

  // UI State
  const [showActionsFor, setShowActionsFor] = useState(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, message: null });
  const [editHistoryModal, setEditHistoryModal] = useState({ isOpen: false, messageId: null, currentText: '' });
  const [newMessageIds, setNewMessageIds] = useState(new Set());

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages(conversation.id);
      markAsRead(conversation.id);
    }
  }, [conversation?.id, fetchMessages, markAsRead]);

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    const currentCount = conversationMessages.length;
    const previousCount = previousMessageCountRef.current;

    if (currentCount > previousCount) {
      // New message(s) added - mark them for animation
      const newIds = new Set();
      for (let i = previousCount; i < currentCount; i++) {
        if (conversationMessages[i]) {
          newIds.add(conversationMessages[i].id);
        }
      }
      setNewMessageIds(newIds);

      // Smooth scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }

      // Remove animation class after animation completes
      setTimeout(() => {
        setNewMessageIds(new Set());
      }, 300);
    }

    previousMessageCountRef.current = currentCount;
  }, [conversationMessages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Ensure we're working with a valid date
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.warn('[MessageThread] Invalid timestamp:', timestamp);
      return '';
    }
    
    // Format using the utility function
    return formatMessageTime(timestamp);
  };

  // Action Handlers
  const handleEdit = (message) => {
    setEditingMessage(message);
    setShowActionsFor(null);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleDelete = (message) => {
    setDeleteConfirmModal({ isOpen: true, message });
    setShowActionsFor(null);
  };

  const handleConfirmDelete = (deletionType) => {
    if (deleteConfirmModal.message) {
      deleteMessage(deleteConfirmModal.message.id, deletionType, conversation.id);
    }
    setDeleteConfirmModal({ isOpen: false, message: null });
  };

  const handleReply = (message) => {
    setReplyToMessage(message);
    setShowActionsFor(null);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const handleReact = (messageId) => {
    setShowEmojiPickerFor(messageId);
    setShowActionsFor(null);
  };

  const handleEmojiSelect = (messageId, emoji) => {
    addReaction(messageId, emoji, conversation.id);
    setShowEmojiPickerFor(null);
  };

  const handleRemoveReaction = (messageId, emoji) => {
    removeReaction(messageId, emoji, conversation.id);
  };

  const handleViewHistory = (message) => {
    setEditHistoryModal({
      isOpen: true,
      messageId: message.id,
      currentText: message.message_text
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0" style={{ margin: 0, padding: 0 }}>
      {/* Messages */}
      <div 
        ref={containerRef}
        className="message-thread-container flex-1 overflow-y-auto min-h-0"
      >
        {conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          conversationMessages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            const isNewMessage = newMessageIds.has(message.id);

            return (
              <div
                key={message.id}
                className={`message-wrapper ${isOwnMessage ? 'sent' : 'received'} ${isNewMessage ? 'animate' : ''}`}
              >
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  user={user}
                  conversation={conversation}
                  formatTime={formatTime}
                  showActionsFor={showActionsFor}
                  setShowActionsFor={setShowActionsFor}
                  showEmojiPickerFor={showEmojiPickerFor}
                  setShowEmojiPickerFor={setShowEmojiPickerFor}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleReply={handleReply}
                  handleReact={handleReact}
                  handleEmojiSelect={handleEmojiSelect}
                  handleRemoveReaction={handleRemoveReaction}
                  handleViewHistory={handleViewHistory}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator conversationId={conversation.id} />

      {/* Message Input */}
      <MessageInput 
        conversationId={conversation.id}
        editingMessage={editingMessage}
        onCancelEdit={handleCancelEdit}
        replyToMessage={replyToMessage}
        onCancelReply={handleCancelReply}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={() => setDeleteConfirmModal({ isOpen: false, message: null })}
        onConfirm={handleConfirmDelete}
        isOwnMessage={deleteConfirmModal.message?.sender_id === user?.id}
      />

      {/* Edit History Modal */}
      <EditHistoryModal
        isOpen={editHistoryModal.isOpen}
        onClose={() => setEditHistoryModal({ isOpen: false, messageId: null, currentText: '' })}
        messageId={editHistoryModal.messageId}
        currentText={editHistoryModal.currentText}
      />
    </div>
  );
};

export default MessageThread;
