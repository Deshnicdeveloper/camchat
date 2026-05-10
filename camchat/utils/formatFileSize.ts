/**
 * File Size Formatting Utility
 */

/**
 * Format bytes to human readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  return `${size} ${units[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get content type from file extension
 */
export function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',

    // Videos
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',

    // Audio
    m4a: 'audio/m4a',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };

  return contentTypes[extension] || 'application/octet-stream';
}

/**
 * Check if file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
}

/**
 * Check if file is a video
 */
export function isVideoFile(filename: string): boolean {
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
  const extension = getFileExtension(filename);
  return videoExtensions.includes(extension);
}

/**
 * Check if file is audio
 */
export function isAudioFile(filename: string): boolean {
  const audioExtensions = ['m4a', 'mp3', 'wav', 'ogg'];
  const extension = getFileExtension(filename);
  return audioExtensions.includes(extension);
}
