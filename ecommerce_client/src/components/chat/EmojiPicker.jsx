/**
 * EMOJI PICKER
 * 
 * Emoji selection component for message reactions
 */

import { useState } from 'react';

const EmojiPicker = ({ onSelectEmoji, onClose, position = 'bottom' }) => {
  const [selectedCategory, setSelectedCategory] = useState('frequent');

  const emojiCategories = {
    frequent: ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'],
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
    gestures: ['👍', '👎', '👏', '🙌', '👐', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👈', '👉', '👆'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗'],
    objects: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱'],
    nature: ['🔥', '⭐', '✨', '💫', '⚡', '☀️', '🌙', '🌟', '💥', '🌈', '🌸', '🌺', '🌻', '🌹', '🌷', '🌼']
  };

  const categories = [
    { id: 'frequent', label: '🕐', name: 'Frequent' },
    { id: 'smileys', label: '😀', name: 'Smileys' },
    { id: 'gestures', label: '👍', name: 'Gestures' },
    { id: 'hearts', label: '❤️', name: 'Hearts' },
    { id: 'objects', label: '🎉', name: 'Objects' },
    { id: 'nature', label: '🔥', name: 'Nature' }
  ];

  const handleEmojiClick = (emoji) => {
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <div className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-80`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Pick a reaction</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close emoji picker"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex-shrink-0 px-3 py-2 rounded-md text-xl transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100'
            }`}
            title={cat.name}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-2">
          {emojiCategories[selectedCategory].map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl hover:bg-gray-100 rounded-md p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        Click an emoji to react
      </div>
    </div>
  );
};

export default EmojiPicker;
