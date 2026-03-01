/**
 * EDIT HISTORY MODAL
 * 
 * Shows the edit history of a message
 */

import { useEffect, useState } from 'react';
import axios from 'axios';

const EditHistoryModal = ({ isOpen, onClose, messageId, currentText }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && messageId) {
      fetchHistory();
    }
  }, [isOpen, messageId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(
        `${API_URL}/chat/messages/${messageId}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching edit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit History</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current version */}
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                    CURRENT
                  </span>
                  <span className="text-xs text-gray-500">Now</span>
                </div>
                <p className="text-gray-900">{currentText}</p>
              </div>

              {/* Edit history */}
              {history.length > 0 ? (
                history.map((edit, index) => (
                  <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        VERSION {history.length - index}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(edit.edited_at)}
                      </span>
                    </div>
                    <p className="text-gray-700">{edit.old_text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No edit history available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHistoryModal;
