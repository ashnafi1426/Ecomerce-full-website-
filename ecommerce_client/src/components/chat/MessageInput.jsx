/**
 * MESSAGE INPUT
 * 
 * Input field for sending messages with typing indicator, file upload, edit and reply modes
 * Features: Text messaging, File sharing, Edit mode, Reply mode
 */

import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import FileUploadButton from './FileUploadButton';
import ImagePreviewModal from './ImagePreviewModal';
import UploadProgress from './UploadProgress';
import ReplyPreview from './ReplyPreview';

const MessageInput = ({ 
  conversationId, 
  editingMessage, 
  onCancelEdit,
  replyToMessage,
  onCancelReply 
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  
  const { sendMessage: sendChatMessage, sendTyping, editMessage, sendReply } = useChat();
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Set message text when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message_text || '');
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  // Focus input when replying
  useEffect(() => {
    if (replyToMessage) {
      inputRef.current?.focus();
    }
  }, [replyToMessage]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Send typing indicator
    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      sendTyping(conversationId, true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(conversationId, false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() === '' && selectedFiles.length === 0) return;

    // Handle edit mode
    if (editingMessage) {
      editMessage(editingMessage.id, message.trim());
      setMessage('');
      onCancelEdit();
      return;
    }

    // Handle reply mode
    if (replyToMessage) {
      sendReply(conversationId, message.trim(), replyToMessage.id, selectedFiles.length > 0 ? selectedFiles : null);
      setMessage('');
      setSelectedFiles([]);
      onCancelReply();
      return;
    }

    // If files are selected, show preview
    if (selectedFiles.length > 0) {
      setShowPreview(true);
      return;
    }

    // Send text message only
    sendChatMessage(conversationId, message.trim());

    // Clear input
    setMessage('');

    // Stop typing indicator
    setIsTyping(false);
    sendTyping(conversationId, false);

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // File upload handlers
  const handleFileSelect = (files) => {
    setSelectedFiles(prev => [...prev, ...files]);
    setShowPreview(true);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setSelectedFiles([]);
  };

  const handleSendWithFiles = async () => {
    setShowPreview(false);
    setUploading(true);
    setUploadProgress(new Array(selectedFiles.length).fill(0));

    try {
      // Create FormData for file upload
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Upload files to backend
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const uploadResponse = await fetch(`${API_URL}/chat/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Update progress to 100%
      setUploadProgress(new Array(selectedFiles.length).fill(100));

      // Send message with uploaded file attachments
      const attachments = uploadResult.data.uploaded.map(file => ({
        name: file.fileName,
        type: file.fileType,
        size: file.fileSize,
        url: file.fileUrl,
        path: file.filePath
      }));

      sendChatMessage(conversationId, message.trim() || 'Sent files', attachments);

      // Clear state
      setMessage('');
      setSelectedFiles([]);
      setUploading(false);
      setUploadProgress([]);
    } catch (error) {
      console.error('[MessageInput] Upload failed:', error);
      setUploading(false);
      alert('Failed to upload files. Please try again.');
    }
  };

  const handleCancelUpload = () => {
    setUploading(false);
    setUploadProgress([]);
    setSelectedFiles([]);
  };

  const handleCancelEditOrReply = () => {
    if (editingMessage) {
      setMessage('');
      onCancelEdit();
    } else if (replyToMessage) {
      onCancelReply();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        {/* Edit Mode Indicator */}
        {editingMessage && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="flex-1 text-sm font-medium text-blue-700">Editing message</span>
            <button
              type="button"
              onClick={handleCancelEditOrReply}
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Reply Mode Indicator */}
        {replyToMessage && !editingMessage && (
          <div className="mb-3">
            <ReplyPreview replyTo={replyToMessage} onCancel={handleCancelEditOrReply} />
          </div>
        )}

        <div className="flex items-end space-x-2">
          {/* File Upload Button - disabled in edit mode */}
          {!editingMessage && (
            <FileUploadButton
              onFileSelect={handleFileSelect}
              disabled={uploading}
            />
          )}

          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={editingMessage ? "Edit your message..." : replyToMessage ? "Type your reply..." : "Type a message..."}
            rows={1}
            disabled={uploading}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Send/Save Button */}
          <button
            type="submit"
            disabled={message.trim() === '' && selectedFiles.length === 0 || uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg p-2 transition-colors"
            aria-label={editingMessage ? "Save changes" : "Send message"}
          >
            {editingMessage ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Selected Files Indicator */}
        {selectedFiles.length > 0 && !showPreview && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</span>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Preview
            </button>
          </div>
        )}
      </form>

      {/* Image Preview Modal */}
      {showPreview && (
        <ImagePreviewModal
          files={selectedFiles}
          onRemove={handleRemoveFile}
          onSend={handleSendWithFiles}
          onCancel={handleCancelPreview}
        />
      )}

      {/* Upload Progress */}
      {uploading && (
        <UploadProgress
          files={selectedFiles}
          progress={uploadProgress}
          onCancel={handleCancelUpload}
        />
      )}
    </>
  );
};

export default MessageInput;
