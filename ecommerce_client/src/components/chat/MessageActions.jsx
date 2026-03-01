/**
 * MESSAGE ACTIONS
 * 
 * Context menu for message actions (edit, delete, reply, react)
 */

import { useState, useRef, useEffect } from 'react';

const MessageActions = ({ 
  message, 
  isOwnMessage, 
  onEdit, 
  onDelete, 
  onReply, 
  onReact,
  onClose 
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute top-8 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
      style={{
        right: 'auto',
        left: '0'
      }}
    >
      {/* Reply */}
      <button
        onClick={() => handleAction(onReply)}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Reply
      </button>

      {/* React */}
      <button
        onClick={() => handleAction(onReact)}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        React
      </button>

      {/* Divider for own messages */}
      {isOwnMessage && <div className="border-t border-gray-200 my-1" />}

      {/* Edit (own messages only) */}
      {isOwnMessage && !message.is_deleted && (
        <button
          onClick={() => handleAction(onEdit)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      )}

      {/* Delete (own messages only) */}
      {isOwnMessage && !message.is_deleted && (
        <button
          onClick={() => handleAction(onDelete)}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      )}

      {/* Copy Text */}
      {!message.is_deleted && message.message_text && (
        <>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              navigator.clipboard.writeText(message.message_text);
              handleAction(() => {});
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Text
          </button>
        </>
      )}
    </div>
  );
};

export default MessageActions;
