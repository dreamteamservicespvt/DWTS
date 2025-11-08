/**
 * Centralized Cloudinary Upload Utility
 * Handles file uploads with progress tracking, retry logic, and validation
 */

const CLOUDINARY_CLOUD_NAME = 'do46xxegj';
const CLOUDINARY_UPLOAD_PRESET = 'dwtsystem';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

/**
 * File validation constants
 */
const VALIDATION = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  allowedDocTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

/**
 * Validate file before upload
 */
export function validateFile(file, options = {}) {
  const {
    maxSize = VALIDATION.maxFileSize,
    allowedTypes = [...VALIDATION.allowedImageTypes, ...VALIDATION.allowedVideoTypes, ...VALIDATION.allowedDocTypes]
  } = options;

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return true;
}

/**
 * Upload file to Cloudinary with progress tracking
 */
export async function uploadFile(file, options = {}) {
  const {
    folder = 'dwts',
    onProgress = null,
    maxRetries = 3,
    validateBeforeUpload = true,
    tags = []
  } = options;

  // Validate file
  if (validateBeforeUpload) {
    validateFile(file, options);
  }

  let lastError = null;
  
  // Retry logic
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);
      
      if (tags.length > 0) {
        formData.append('tags', tags.join(','));
      }

      // Add context metadata
      formData.append('context', `uploaded_at=${Date.now()}|filename=${file.name}`);

      const xhr = new XMLHttpRequest();

      // Setup progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete, e.loaded, e.total);
          }
        });
      }

      // Wrap XHR in promise
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('POST', CLOUDINARY_URL);
        xhr.send(formData);
      });

      const response = await uploadPromise;

      // Return formatted response
      return {
        success: true,
        url: response.secure_url,
        publicId: response.public_id,
        format: response.format,
        width: response.width,
        height: response.height,
        size: response.bytes,
        resourceType: response.resource_type,
        createdAt: response.created_at,
        thumbnail: response.eager?.[0]?.secure_url || response.secure_url,
        rawResponse: response
      };
    } catch (error) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  throw new Error(`Upload failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadMultipleFiles(files, options = {}) {
  const {
    onProgressUpdate = null,
    concurrency = 3
  } = options;

  const results = [];
  const errors = [];
  let completed = 0;

  // Process files in batches
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = Array.from(files).slice(i, i + concurrency);
    
    const batchPromises = batch.map((file, batchIndex) => {
      const fileIndex = i + batchIndex;
      
      return uploadFile(file, {
        ...options,
        onProgress: (percent, loaded, total) => {
          if (onProgressUpdate) {
            onProgressUpdate(fileIndex, percent, loaded, total, completed, files.length);
          }
        }
      })
        .then(result => {
          completed++;
          results[fileIndex] = { success: true, file, result };
          return result;
        })
        .catch(error => {
          completed++;
          errors.push({ file, error: error.message });
          results[fileIndex] = { success: false, file, error: error.message };
          return null;
        });
    });

    await Promise.all(batchPromises);
  }

  return {
    results: results.filter(r => r.success).map(r => r.result),
    errors,
    total: files.length,
    successful: results.filter(r => r.success).length,
    failed: errors.length
  };
}

/**
 * Generate Cloudinary transformation URL
 */
export function generateTransformationUrl(publicId, transformations = {}) {
  const {
    width = null,
    height = null,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto'
  } = transformations;

  const params = [];
  if (width) params.push(`w_${width}`);
  if (height) params.push(`h_${height}`);
  params.push(`c_${crop}`);
  params.push(`q_${quality}`);
  params.push(`f_${format}`);
  params.push(`g_${gravity}`);

  const transformString = params.join(',');
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${publicId}`;
}

/**
 * Generate thumbnail URL
 */
export function generateThumbnailUrl(publicId, size = 200) {
  return generateTransformationUrl(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto'
  });
}

/**
 * Delete file from Cloudinary (requires backend proxy)
 */
export async function deleteFile(publicId) {
  // Note: Direct deletion from frontend is not secure
  // This should be implemented as a backend endpoint
  console.warn('File deletion should be implemented on backend for security');
  
  // For now, just return success
  // In production, call your backend API:
  // const response = await fetch('/api/cloudinary/delete', {
  //   method: 'DELETE',
  //   body: JSON.stringify({ publicId })
  // });
  
  return { success: true, message: 'Deletion queued (implement backend endpoint)' };
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const {
    width = null,
    quality = 'auto',
    format = 'auto'
  } = options;

  // Extract public ID from URL
  const urlParts = url.split('/upload/');
  if (urlParts.length !== 2) return url;

  const [baseUrl, path] = urlParts;
  const params = [];
  
  if (width) params.push(`w_${width}`);
  params.push(`q_${quality}`);
  params.push(`f_${format}`);

  return `${baseUrl}/upload/${params.join(',')}/${path}`;
}

/**
 * Compress image before upload (optional preprocessing)
 */
export async function compressImage(file, maxWidth = 1920, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default {
  uploadFile,
  uploadMultipleFiles,
  validateFile,
  generateTransformationUrl,
  generateThumbnailUrl,
  deleteFile,
  getOptimizedImageUrl,
  compressImage,
  formatFileSize,
  VALIDATION
};
