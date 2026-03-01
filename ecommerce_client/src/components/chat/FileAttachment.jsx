/**
 * FILE ATTACHMENT
 * 
 * Displays file attachments in messages (images and documents)
 * Feature 2: File & Image Sharing
 */

import { useState } from 'react';

const FileAttachment = ({ attachment, isOwnMessage }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImage = attachment.type?.startsWith('image/');

  const handleDownload = () => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isImage && !imageError) {
    return (
      <>
        <div className="mt-2">
          <img
            src={attachment.url}
            alt={attachment.name}
            onError={() => setImageError(true)}
            onClick={() => setShowFullImage(true)}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            style={{ maxHeight: '300px' }}
          />
          <p className="text-xs mt-1 opacity-75">{attachment.name}</p>
        </div>

        {/* Full Image Modal */}
        {showFullImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFullImage(false)}
          >
            <div className="relative max-w-7xl max-h-full">
              <button
                onClick={() => setShowFullImage(false)}
                className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={attachment.url}
                alt={attachment.name}
                className="max-w-full max-h-screen object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
                <p className="text-sm">{attachment.name}</p>
                <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Document attachment
  return (
    <div className="mt-2">
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg border ${
          isOwnMessage
            ? 'bg-blue-500 bg-opacity-20 border-blue-400'
            : 'bg-gray-100 border-gray-300'
        }`}
      >
        <div className="flex-shrink-0">
          <svg
            className={`w-8 h-8 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
            {attachment.name}
          </p>
          <p className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatFileSize(attachment.size)}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            isOwnMessage
              ? 'hover:bg-blue-600 text-white'
              : 'hover:bg-gray-200 text-gray-600'
          }`}
          aria-label="Download file"
          title="Download"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FileAttachment;
