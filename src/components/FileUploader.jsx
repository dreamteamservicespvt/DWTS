/**
 * FileUploader Component
 * Drag-and-drop file uploader with progress tracking and preview
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  uploadFile, 
  uploadMultipleFiles, 
  validateFile, 
  formatFileSize,
  VALIDATION,
  compressImage
} from '../lib/cloudinaryUpload';

export default function FileUploader({ 
  onUploadComplete,
  onUploadError,
  folder = 'dwts/tasks',
  multiple = true,
  maxFiles = 10,
  allowedTypes = [...VALIDATION.allowedImageTypes, ...VALIDATION.allowedVideoTypes],
  compressImages = true,
  showPreviews = true,
  tags = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesSelected(droppedFiles);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFilesSelected(selectedFiles);
  };

  const handleFilesSelected = (selectedFiles) => {
    // Limit number of files
    const filesToAdd = multiple ? selectedFiles.slice(0, maxFiles - files.length) : [selectedFiles[0]];

    // Validate each file
    const validatedFiles = filesToAdd.map(file => {
      try {
        validateFile(file, { allowedTypes });
        return {
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'pending',
          progress: 0,
          error: null,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        };
      } catch (error) {
        return {
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: 'error',
          progress: 0,
          error: error.message,
          preview: null
        };
      }
    });

    setFiles(prev => [...prev, ...validatedFiles]);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const uploadFiles = async () => {
    const filesToUpload = files.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) return;

    setUploading(true);

    try {
      // Process files with compression if needed
      const processedFiles = await Promise.all(
        filesToUpload.map(async ({ file }) => {
          if (compressImages && file.type.startsWith('image/')) {
            try {
              return await compressImage(file);
            } catch {
              return file; // Fall back to original if compression fails
            }
          }
          return file;
        })
      );

      // Upload with progress tracking
      const results = await uploadMultipleFiles(processedFiles, {
        folder,
        tags,
        concurrency: 3,
        onProgressUpdate: (fileIndex, percent, loaded, total, completed, totalFiles) => {
          setFiles(prev => {
            const updated = [...prev];
            const uploadingFiles = prev.filter(f => f.status === 'pending');
            if (uploadingFiles[fileIndex]) {
              const fileId = uploadingFiles[fileIndex].id;
              const index = prev.findIndex(f => f.id === fileId);
              if (index !== -1) {
                updated[index] = {
                  ...updated[index],
                  status: 'uploading',
                  progress: percent
                };
              }
            }
            return updated;
          });
        }
      });

      // Update file statuses
      setFiles(prev => {
        const updated = [...prev];
        results.results.forEach((result, idx) => {
          const fileToUpdate = filesToUpload[idx];
          const index = updated.findIndex(f => f.id === fileToUpdate.id);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              status: 'complete',
              progress: 100,
              url: result.url,
              publicId: result.publicId
            };
          }
        });

        results.errors.forEach((error, idx) => {
          const fileToUpdate = filesToUpload[idx + results.successful];
          const index = updated.findIndex(f => f.id === fileToUpdate?.id);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              status: 'error',
              error: error.error
            };
          }
        });

        return updated;
      });

      // Notify parent
      if (onUploadComplete) {
        onUploadComplete(results.results);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => {
      const toKeep = prev.filter(f => f.status !== 'complete');
      const toRemove = prev.filter(f => f.status === 'complete');
      toRemove.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      return toKeep;
    });
  };

  const hasFilesToUpload = files.some(f => f.status === 'pending');
  const hasCompleted = files.some(f => f.status === 'complete');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300
          ${isDragging 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="text-lg font-medium text-neutral-900 dark:text-white">
              {isDragging ? 'Drop files here' : 'Click or drag files here'}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {multiple ? `Upload up to ${maxFiles} files` : 'Upload a single file'} (max 10MB each)
            </p>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            {files.map((fileItem) => (
              <motion.div
                key={fileItem.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-neutral-700"
              >
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  {showPreviews && fileItem.preview && (
                    <img 
                      src={fileItem.preview} 
                      alt={fileItem.file.name}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatFileSize(fileItem.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${fileItem.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{fileItem.progress}%</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {fileItem.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div>
                    {fileItem.status === 'pending' && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {fileItem.status === 'uploading' && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
                    )}
                    {fileItem.status === 'complete' && (
                      <div className="text-green-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {fileItem.status === 'error' && (
                      <div className="text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {files.length > 0 && (
        <div className="flex gap-3">
          {hasFilesToUpload && (
            <button
              onClick={uploadFiles}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium
                       hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload {files.filter(f => f.status === 'pending').length} file(s)
                </>
              )}
            </button>
          )}

          {hasCompleted && (
            <button
              onClick={clearCompleted}
              className="px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300
                       rounded-lg font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              Clear Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
