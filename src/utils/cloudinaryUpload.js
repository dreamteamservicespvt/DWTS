/**
 * Cloudinary Upload Helper
 * Handles file uploads to Cloudinary with progress tracking
 */

/**
 * Upload a file to Cloudinary (supports images, videos, and documents)
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Optional progress callback
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload result with URL and metadata
 */
export const uploadToCloudinary = async (file, onProgress = null, options = {}) => {
  if (!file) {
    throw new Error('No file provided');
  }

  const {
    folder = 'dwts-deliverables',
    maxSize = 100 * 1024 * 1024, // 100MB default
  } = options;

  // Determine resource type based on file type
  let resourceType = 'auto';
  let endpoint = 'auto';
  
  if (file.type.startsWith('image/')) {
    resourceType = 'image';
    endpoint = 'image';
  } else if (file.type.startsWith('video/')) {
    resourceType = 'video';
    endpoint = 'video';
  } else {
    resourceType = 'raw';
    endpoint = 'raw';
  }

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  // Fallback configuration for production
  const productionCloudinaryConfig = {
    cloudName: 'do46xxegj',
    uploadPreset: 'dwtsystem'
  };

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || productionCloudinaryConfig.cloudName;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || productionCloudinaryConfig.uploadPreset;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please check your .env file.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    
    const uploadPromise = new Promise((resolve, reject) => {
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } else {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error?.message || 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`);
      xhr.send(formData);
    });

    const data = await uploadPromise;

    if (!data.secure_url) {
      throw new Error('Upload succeeded but no URL returned');
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type,
      format: data.format,
      size: data.bytes,
      width: data.width,
      height: data.height,
      thumbnail: data.thumbnail_url || data.secure_url,
      originalFilename: file.name
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary with progress tracking
 * @param {FileList|Array<File>} files - The files to upload
 * @param {Function} onProgress - Progress callback (progress, current, total)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Array<Object>>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, onProgress = null, options = {}) => {
  const fileArray = Array.from(files);
  const results = [];
  let completedFiles = 0;

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];
    
    try {
      const result = await uploadToCloudinary(file, (fileProgress) => {
        if (onProgress) {
          const totalProgress = ((completedFiles + fileProgress / 100) / fileArray.length) * 100;
          onProgress(totalProgress, i + 1, fileArray.length);
        }
      }, options);

      results.push({
        name: file.name,
        url: result.url,
        thumbnail: result.thumbnail,
        type: file.type,
        size: result.size,
        publicId: result.publicId,
        resourceType: result.resourceType,
        uploadedAt: new Date().toISOString(),
        success: true
      });

      completedFiles++;
      
      if (onProgress) {
        const totalProgress = (completedFiles / fileArray.length) * 100;
        onProgress(totalProgress, completedFiles, fileArray.length);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      results.push({
        name: file.name,
        error: error.message,
        success: false
      });
      completedFiles++;
    }
  }

  return results;
};

/**
 * Delete an image from Cloudinary (requires server-side implementation)
 * This is a placeholder - actual deletion requires backend API with Cloudinary credentials
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFromCloudinary = async (publicId) => {
  console.warn('Delete operation requires server-side implementation');
  // In production, this should call your backend API
  // which has the Cloudinary API secret
  return false;
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - The Cloudinary URL
 * @returns {string} - The public ID
 */
export const getPublicIdFromUrl = (url) => {
  if (!url) return '';
  
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const publicId = filename.split('.')[0];
  
  return publicId;
};

/**
 * Generate a thumbnail URL from Cloudinary URL
 * @param {string} url - The original Cloudinary URL
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} - The thumbnail URL
 */
export const getThumbnailUrl = (url, width = 200, height = 200) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  return url.replace('/upload/', `/upload/c_thumb,w_${width},h_${height}/`);
};

export default uploadToCloudinary;
