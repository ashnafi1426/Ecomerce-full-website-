/**
 * CHAT WINDOW - TELEGRAM STYLE
 * 
 * Modern Telegram Web-inspired chat interface
 */

import { useState } from 'react';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import UserSearch from './UserSearch';
import './ChatWindow.css';

const ChatWindow = ({ isOpen, onClose }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowUserSearch(false);
  };

  const handleBack = () => {
    if (showUserSearch) {
      setShowUserSearch(false);
    } else {
      setSelectedConversation(null);
    }
  };

  const handleNewChat = () => {
    setShowUserSearch(true);
  };

  if (!isOpen) return null;

  return (
    <div className="telegram-chat-window">
      {/* Telegram-Style Header with Gradient */}
      <div className="telegram-chat-header">
        <div className="telegram-header-left">
          {(selectedConversation || showUserSearch) && (
            <button
              onClick={handleBack}
              className="telegram-icon-btn telegram-back-btn"
              aria-label="Back"
            >
              <svg className="telegram-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h3 className="telegram-header-title">
            {selectedConversation ? 'Chat' : showUserSearch ? 'New Chat' : 'Messages'}
          </h3>
        </div>
        <div className="telegram-header-right">
          {!selectedConversation && !showUserSearch && (
            <button
              onClick={handleNewChat}
              className="telegram-icon-btn"
              title="New conversation"
            >
              <svg className="telegram-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="telegram-icon-btn telegram-close-btn"
            aria-label="Close chat"
          >
            <svg className="telegram-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area with Soft Background */}
      <div className="telegram-chat-content">
        {showUserSearch ? (
          <UserSearch 
            onSelectUser={handleSelectConversation}
            onClose={() => setShowUserSearch(false)}
          />
        ) : selectedConversation ? (
          <MessageThread conversation={selectedConversation} />
        ) : (
          <ConversationList onSelectConversation={handleSelectConversation} />
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
