/**
 * Supabase Storage Helpers
 * Utility functions for uploading and managing files in Supabase Storage
 */

import { supabase, STORAGE_BUCKETS, StorageBucket } from './supabase';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
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
 * Upload user avatar
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
 * Upload chat media (image, video, document)
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
 * Upload voice note
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
 * Upload status media
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
