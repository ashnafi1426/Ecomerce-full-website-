/**
 * REACTION LIST
 * 
 * Displays emoji reactions on messages
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';

const ReactionList = ({ reactions, messageId, onReactionClick, onRemoveReaction }) => {
  const { user } = useSelector((state) => state.auth);
  const [showTooltip, setShowTooltip] = useState(null);

  if (!reactions || reactions.length === 0) return null;

  const handleReactionClick = (reaction) => {
    const userReacted = reaction.user_ids?.includes(user?.id);
    
    if (userReacted) {
      // Remove reaction if user already reacted
      onRemoveReaction(messageId, reaction.reaction);
    } else {
      // Add reaction if user hasn't reacted
      onReactionClick(messageId, reaction.reaction);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction, index) => {
        const userReacted = reaction.user_ids?.includes(user?.id);
        
        return (
          <div key={index} className="relative">
            <button
              onClick={() => handleReactionClick(reaction)}
              onMouseEnter={() => setShowTooltip(index)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-all ${
                userReacted
                  ? 'bg-blue-100 border border-blue-300 text-blue-700'
                  : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-base">{reaction.reaction}</span>
              <span className="text-xs font-medium">{reaction.count}</span>
            </button>

            {/* Tooltip showing who reacted */}
            {showTooltip === index && reaction.user_ids && reaction.user_ids.length > 0 && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                  {reaction.count === 1 ? (
                    userReacted ? 'You' : '1 person'
                  ) : (
                    <>
                      {userReacted ? 'You and ' : ''}
                      {userReacted ? reaction.count - 1 : reaction.count} {reaction.count === 2 && userReacted ? 'other' : 'others'}
                    </>
                  )}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReactionList;
