/**
 * Supabase Storage Helpers
 * Utility functions for uploading and managing files in Supabase Storage
 */

import { supabase, STORAGE_BUCKETS, StorageBucket } from './supabase';
import { readAsStringAsync, EncodingType } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage from a local URI
 * @param bucket - The storage bucket name
 * @param path - The path/filename in the bucket
 * @param fileUri - Local file URI (file://)
 * @param contentType - MIME type of the file
 */
export async function uploadFileFromUri(
  bucket: StorageBucket,
  path: string,
  fileUri: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  try {
    console.log(`📤 Uploading file to ${bucket}/${path}`);

    // Read the file as base64
    const base64 = await readAsStringAsync(fileUri, {
      encoding: EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType,
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('✅ Upload successful:', urlData.publicUrl);
    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('❌ Upload exception:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return { success: false, error: errorMessage };
  }
}

/**
 * Upload a file to Supabase Storage (Blob/ArrayBuffer version)
 */
export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: Blob | ArrayBuffer,
  contentType: string
): Promise<UploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload user avatar from local URI
 * @param userId - The user's ID
 * @param fileUri - Local file URI from ImagePicker
 */
export async function uploadAvatarFromUri(
  userId: string,
  fileUri: string
): Promise<UploadResult> {
  // Generate unique filename with timestamp to avoid caching issues
  const timestamp = Date.now();
  const extension = getFileExtension(fileUri) || 'jpg';
  const path = `${userId}/avatar_${timestamp}.${extension}`;
  const contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  return uploadFileFromUri(STORAGE_BUCKETS.AVATARS, path, fileUri, contentType);
}

/**
 * Upload user avatar (Blob/ArrayBuffer version)
 */
export async function uploadAvatar(
  userId: string,
  file: Blob | ArrayBuffer,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  const path = `${userId}.jpg`;
  return uploadFile(STORAGE_BUCKETS.AVATARS, path, file, contentType);
}

/**
 * Upload chat media from local URI
 */
export async function uploadChatMediaFromUri(
  chatId: string,
  senderId: string,
  fileUri: string,
  mediaType: 'image' | 'video' | 'document' | 'audio'
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = getFileExtension(fileUri) || getDefaultExtension(mediaType);
  const path = `${chatId}/${senderId}/${mediaType}_${timestamp}.${extension}`;
  const contentType = getContentType(mediaType, extension);

  return uploadFileFromUri(STORAGE_BUCKETS.CHAT_MEDIA, path, fileUri, contentType);
}

/**
 * Upload chat media (Blob/ArrayBuffer version)
 */
export async function uploadChatMedia(
  chatId: string,
  messageId: string,
  file: Blob | ArrayBuffer,
  contentType: string,
  fileExtension: string
): Promise<UploadResult> {
  const path = `${chatId}/${messageId}.${fileExtension}`;
  return uploadFile(STORAGE_BUCKETS.CHAT_MEDIA, path, file, contentType);
}

/**
 * Upload voice note from local URI
 */
export async function uploadVoiceNoteFromUri(
  chatId: string,
  senderId: string,
  fileUri: string
): Promise<UploadResult> {
  const timestamp = Date.now();
  const path = `${chatId}/${senderId}/voice_${timestamp}.m4a`;

  return uploadFileFromUri(STORAGE_BUCKETS.VOICE_NOTES, path, fileUri, 'audio/m4a');
}

/**
 * Upload voice note (Blob/ArrayBuffer version)
 */
export async function uploadVoiceNote(
  chatId: string,
  messageId: string,
  file: Blob | ArrayBuffer
): Promise<UploadResult> {
  const path = `${chatId}/${messageId}.m4a`;
  return uploadFile(STORAGE_BUCKETS.VOICE_NOTES, path, file, 'audio/m4a');
}

/**
 * Upload status media from local URI
 */
export async function uploadStatusMediaFromUri(
  userId: string,
  fileUri: string,
  isVideo: boolean = false
): Promise<UploadResult> {
  const timestamp = Date.now();
  const extension = isVideo ? 'mp4' : (getFileExtension(fileUri) || 'jpg');
  const path = `${userId}/status_${timestamp}.${extension}`;
  const contentType = isVideo ? 'video/mp4' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;

  return uploadFileFromUri(STORAGE_BUCKETS.STATUSES, path, fileUri, contentType);
}

/**
 * Upload status media (Blob/ArrayBuffer version)
 */
export async function uploadStatusMedia(
  userId: string,
  statusId: string,
  file: Blob | ArrayBuffer,
  contentType: string,
  fileExtension: string
): Promise<UploadResult> {
  const path = `${userId}/${statusId}.${fileExtension}`;
  return uploadFile(STORAGE_BUCKETS.STATUSES, path, file, contentType);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
}

/**
 * Delete user avatar
 */
export async function deleteAvatar(userId: string): Promise<{ success: boolean; error?: string }> {
  return deleteFile(STORAGE_BUCKETS.AVATARS, `${userId}.jpg`);
}

/**
 * Delete status media
 */
export async function deleteStatusMedia(
  userId: string,
  statusId: string,
  fileExtension: string
): Promise<{ success: boolean; error?: string }> {
  return deleteFile(STORAGE_BUCKETS.STATUSES, `${userId}/${statusId}.${fileExtension}`);
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get file extension from URI
 */
function getFileExtension(uri: string): string | null {
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Get default extension for media type
 */
function getDefaultExtension(mediaType: string): string {
  switch (mediaType) {
    case 'image':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'audio':
      return 'm4a';
    case 'document':
      return 'pdf';
    default:
      return 'bin';
  }
}

/**
 * Get content type for media
 */
function getContentType(mediaType: string, extension: string): string {
  switch (mediaType) {
    case 'image':
      return `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    case 'video':
      return `video/${extension}`;
    case 'audio':
      return `audio/${extension}`;
    case 'document':
      if (extension === 'pdf') return 'application/pdf';
      if (extension === 'doc' || extension === 'docx') return 'application/msword';
      return 'application/octet-stream';
    default:
      return 'application/octet-stream';
  }
}
