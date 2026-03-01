/**
 * EDITED INDICATOR
 * 
 * Shows "edited" badge on edited messages
 */

import { useState } from 'react';

const EditedIndicator = ({ message, onViewHistory }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!message.is_edited) return null;

  const formatEditTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={onViewHistory}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-xs text-gray-500 hover:text-gray-700 italic ml-1 transition-colors"
      >
        (edited)
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
            {message.edit_count > 1 ? (
              <>Edited {message.edit_count} times</>
            ) : (
              <>Edited {message.last_edited_at ? formatEditTime(message.last_edited_at) : ''}</>
            )}
            <div className="text-gray-400 mt-1">Click to view history</div>
            <div className="absolute top-full left-4 transform -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditedIndicator;
