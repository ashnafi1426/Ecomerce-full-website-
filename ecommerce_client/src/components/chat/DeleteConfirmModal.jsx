/**
 * DELETE CONFIRM MODAL
 * 
 * Confirmation dialog for message deletion
 */

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isOwnMessage }) => {
  if (!isOpen) return null;

  const handleDelete = (deletionType) => {
    onConfirm(deletionType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Delete Message</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Choose how you want to delete this message:
          </p>

          <div className="space-y-3">
            {/* Delete for me */}
            <button
              onClick={() => handleDelete('for_me')}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-blue-600">Delete for me</p>
                  <p className="text-sm text-gray-500 mt-1">
                    This message will be removed from your chat, but others can still see it.
                  </p>
                </div>
              </div>
            </button>

            {/* Delete for everyone (only for own messages) */}
            {isOwnMessage && (
              <button
                onClick={() => handleDelete('for_everyone')}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-red-600">Delete for everyone</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This message will be removed for all participants in this chat.
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
