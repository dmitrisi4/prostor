/**
 * Utility functions for file operations
 */

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

/**
 * Get file type based on mime type or extension
 */
export const getFileType = (mimeType: string, filename: string): string => {
  // Extract main type from mime type
  const mainType = mimeType.split('/')[0];

  // Handle common types
  if (mainType === 'image') {
    return 'image';
  } else if (mainType === 'video') {
    return 'video';
  } else if (mainType === 'audio') {
    return 'audio';
  } else if (mimeType === 'application/pdf') {
    return 'pdf';
  } else if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'document';
  } else if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return 'spreadsheet';
  } else if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'presentation';
  }

  // Fallback to extension-based detection
  const extension = getFileExtension(filename);

  // Check common extensions
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return 'image';
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return 'video';
  } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
    return 'audio';
  } else if (extension === 'pdf') {
    return 'pdf';
  } else if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
    return 'document';
  } else if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
    return 'spreadsheet';
  } else if (['ppt', 'pptx', 'odp'].includes(extension)) {
    return 'presentation';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'archive';
  } else if (['html', 'css', 'js', 'ts', 'json', 'xml'].includes(extension)) {
    return 'code';
  }

  // Default
  return 'other';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate a thumbnail path for a file
 */
export const generateThumbnailPath = (fileKey: string): string => {
  const parts = fileKey.split('/');
  const filename = parts.pop() || '';
  return [...parts, `thumb_${filename}`].join('/');
};

/**
 * Check if a file is an image
 */
export const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

/**
 * Check if a file is a video
 */
export const isVideo = (mimeType: string): boolean => {
  return mimeType.startsWith('video/');
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove invalid characters
  return filename
    .replace(/[\\/:*?"<>|]/g, '_') // Replace invalid characters with underscore
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single underscore
    .trim();
};