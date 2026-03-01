/**
 * UPLOAD PROGRESS
 * 
 * Shows upload progress for files being sent
 * Feature 2: File & Image Sharing
 */

const UploadProgress = ({ files, progress, onCancel }) => {
  if (!files || files.length === 0) return null;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-semibold">Uploading {files.length} file{files.length !== 1 ? 's' : ''}...</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="hover:bg-blue-700 rounded p-1"
            aria-label="Cancel upload"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress List */}
      <div className="max-h-96 overflow-y-auto p-4 space-y-3">
        {files.map((file, index) => {
          const fileProgress = progress[index] || 0;
          const isComplete = fileProgress >= 100;

          return (
            <div key={index} className="space-y-2">
              {/* File Info */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium text-blue-600">{fileProgress}%</span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isComplete ? 'bg-green-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${fileProgress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Progress */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Overall Progress
          </span>
          <span className="font-medium text-gray-900">
            {Math.round(
              progress.reduce((sum, p) => sum + p, 0) / files.length
            )}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
