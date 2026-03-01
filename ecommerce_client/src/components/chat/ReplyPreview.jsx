/**
 * REPLY PREVIEW
 * 
 * Shows the message being replied to
 */

const ReplyPreview = ({ replyTo, onCancel, compact = false }) => {
  if (!replyTo) return null;

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (compact) {
    // Compact version shown above the message
    return (
      <div className="flex items-start gap-2 mb-1 text-xs">
        <div className="w-1 h-full bg-blue-500 rounded-full"></div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 font-medium truncate">
            {replyTo.sender_name || 'Someone'}
          </p>
          <p className="text-gray-500 truncate">
            {truncateText(replyTo.message_text, 40)}
          </p>
        </div>
      </div>
    );
  }

  // Full version shown in message input area
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 border-l-4 border-blue-500 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Replying to {replyTo.sender_name || 'Someone'}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {replyTo.message_text || 'Message'}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
        aria-label="Cancel reply"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ReplyPreview;
