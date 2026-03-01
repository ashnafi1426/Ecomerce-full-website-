/**
 * FILE UPLOAD BUTTON
 * 
 * Button to trigger file/image upload with drag & drop support
 * Feature 2: File & Image Sharing
 */

import { useRef, useState } from 'react';

const FileUploadButton = ({ onFileSelect, disabled = false }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Supported file types
  const SUPPORTED_TYPES = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    all: []
  };

  SUPPORTED_TYPES.all = [...SUPPORTED_TYPES.images, ...SUPPORTED_TYPES.documents];

  // Max file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const validateFile = (file) => {
    // Check file type
    if (!SUPPORTED_TYPES.all.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type. Supported: Images (JPG, PNG, GIF, WebP) and Documents (PDF, DOC, DOCX, TXT)`
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return { valid: true };
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = (files) => {
    if (files.length === 0) return;

    const validFiles = [];
    const errors = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push({ file: file.name, error: validation.error });
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach(({ file, error }) => {
        console.error(`[FileUpload] ${file}: ${error}`);
        // You can show toast notification here
        alert(`${file}: ${error}`);
      });
    }

    // Pass valid files to parent
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_TYPES.all.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload files"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`p-2 rounded-lg transition-colors ${
          disabled
            ? 'text-gray-300 cursor-not-allowed'
            : isDragging
            ? 'text-blue-600 bg-blue-50'
            : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'
        }`}
        title="Upload files (images or documents)"
        aria-label="Upload files"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>

      {/* Drag overlay (optional visual feedback) */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500 bg-opacity-10 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-semibold text-gray-900">Drop files here</p>
            <p className="text-sm text-gray-500 mt-1">Images or documents (max 10MB)</p>
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploadButton;
