/**
 * Cloudinary Service - Handle all image uploads
 * Cloud Name: do46xxegj
 * Upload Preset: dwtsystem
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'do46xxegj';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'dwtsystem';

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Upload response with URL
 */
export const uploadImage = async (file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Add optional parameters
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }
    if (options.transformation) {
      formData.append('transformation', JSON.stringify(options.transformation));
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      resourceType: data.resource_type,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple images
 * @param {FileList|Array} files - Array of image files
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload responses
 */
export const uploadMultipleImages = async (files, options = {}) => {
  try {
    const uploadPromises = Array.from(files).map(file => 
      uploadImage(file, options)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

/**
 * Upload client logo
 * @param {File} file - Logo file
 * @param {string} clientName - Client name for folder organization
 * @returns {Promise<Object>} - Upload response
 */
export const uploadClientLogo = async (file, clientName) => {
  return uploadImage(file, {
    folder: `dwts/clients/${clientName}/logo`,
    tags: ['client-logo', clientName],
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    },
  });
};

/**
 * Upload task deliverable
 * @param {File} file - Deliverable file
 * @param {Object} metadata - Task metadata
 * @returns {Promise<Object>} - Upload response
 */
export const uploadTaskDeliverable = async (file, metadata = {}) => {
  const { clientName, projectName, taskType } = metadata;
  
  return uploadImage(file, {
    folder: `dwts/deliverables/${clientName}/${projectName}`,
    tags: ['task-deliverable', clientName, projectName, taskType],
  });
};

/**
 * Upload user profile picture
 * @param {File} file - Profile picture file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Upload response
 */
export const uploadProfilePicture = async (file, userId) => {
  return uploadImage(file, {
    folder: `dwts/users/${userId}`,
    tags: ['profile-picture', userId],
    transformation: {
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    },
  });
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Image transformations
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = transformations;

  const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  const transforms = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
  
  return `${baseUrl}/${transforms}/${publicId}`;
};

/**
 * Generate thumbnail URL
 * @param {string} url - Original image URL
 * @param {number} size - Thumbnail size
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (url, size = 150) => {
  if (!url) return '';
  
  // Extract public ID from Cloudinary URL
  const matches = url.match(/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  if (!matches) return url;
  
  const publicId = matches[1];
  return getOptimizedImageUrl(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
  });
};

/**
 * Delete image from Cloudinary (requires backend implementation)
 * Note: Deletion requires authentication, should be done server-side
 * @param {string} publicId - Public ID of image to delete
 */
export const deleteImage = async (publicId) => {
  console.warn('Image deletion should be implemented server-side for security');
  // This would typically call your backend API
  // Backend would use Cloudinary Admin API with API secret
  return { message: 'Delete operation should be server-side' };
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} constraints - Validation constraints
 * @returns {Object} - Validation result
 */
export const validateFile = (file, constraints = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  } = constraints;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / 1024 / 1024}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Compress image before upload (client-side)
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
    } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => resolve(blob),
          file.type,
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export default {
  uploadImage,
  uploadMultipleImages,
  uploadClientLogo,
  uploadTaskDeliverable,
  uploadProfilePicture,
  getOptimizedImageUrl,
  getThumbnailUrl,
  deleteImage,
  validateFile,
  compressImage,
};
