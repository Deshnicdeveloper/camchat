/**
 * useVoiceNoteCache Hook
 * Downloads and caches voice notes locally for instant playback
 * Similar to WhatsApp's approach
 */

import { useState, useCallback, useEffect, useRef } from 'react';
// @ts-ignore - expo-file-system types issue
import * as FileSystem from 'expo-file-system';

interface CachedVoiceNote {
  remoteUrl: string;
  localUri: string;
  downloadedAt: number;
  size?: number;
}

interface VoiceNoteCacheState {
  cache: Map<string, CachedVoiceNote>;
  downloading: Set<string>;
  downloadProgress: Map<string, number>;
}

interface UseVoiceNoteCacheReturn {
  // Get local URI for a voice note (returns null if not downloaded)
  getLocalUri: (remoteUrl: string) => string | null;
  // Check if a voice note is downloaded
  isDownloaded: (remoteUrl: string) => boolean;
  // Check if a voice note is currently downloading
  isDownloading: (remoteUrl: string) => boolean;
  // Get download progress (0-100)
  getProgress: (remoteUrl: string) => number;
  // Download a voice note
  download: (remoteUrl: string, messageId: string) => Promise<string | null>;
  // Clear the cache
  clearCache: () => Promise<void>;
}

// Cache directory for voice notes
// @ts-ignore - expo-file-system types issue
const VOICE_CACHE_DIR = `${FileSystem.cacheDirectory || ''}voice_notes/`;

// Global cache state (persists across hook instances)
const globalCache = new Map<string, CachedVoiceNote>();
const globalDownloading = new Set<string>();
const globalDownloadProgress = new Map<string, number>();

export function useVoiceNoteCache(): UseVoiceNoteCacheReturn {
  const [, forceUpdate] = useState({});
  const mountedRef = useRef(true);

  // Ensure cache directory exists
  useEffect(() => {
    const ensureCacheDir = async () => {
      const dirInfo = await FileSystem.getInfoAsync(VOICE_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(VOICE_CACHE_DIR, { intermediates: true });
        console.log('📁 Voice cache directory created');
      }
    };
    ensureCacheDir();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Get local URI for a voice note
   */
  const getLocalUri = useCallback((remoteUrl: string): string | null => {
    const cached = globalCache.get(remoteUrl);
    return cached?.localUri || null;
  }, []);

  /**
   * Check if downloaded
   */
  const isDownloaded = useCallback((remoteUrl: string): boolean => {
    return globalCache.has(remoteUrl);
  }, []);

  /**
   * Check if downloading
   */
  const isDownloading = useCallback((remoteUrl: string): boolean => {
    return globalDownloading.has(remoteUrl);
  }, []);

  /**
   * Get download progress
   */
  const getProgress = useCallback((remoteUrl: string): number => {
    return globalDownloadProgress.get(remoteUrl) || 0;
  }, []);

  /**
   * Download a voice note
   */
  const download = useCallback(async (remoteUrl: string, messageId: string): Promise<string | null> => {
    // Already cached
    const cached = globalCache.get(remoteUrl);
    if (cached) {
      // Verify file still exists
      const info = await FileSystem.getInfoAsync(cached.localUri);
      if (info.exists) {
        console.log('✅ Voice note already cached:', messageId);
        return cached.localUri;
      }
      // File was deleted, remove from cache
      globalCache.delete(remoteUrl);
    }

    // Already downloading
    if (globalDownloading.has(remoteUrl)) {
      console.log('⏳ Voice note already downloading:', messageId);
      return null;
    }

    try {
      globalDownloading.add(remoteUrl);
      globalDownloadProgress.set(remoteUrl, 0);
      if (mountedRef.current) forceUpdate({});

      console.log('📥 Downloading voice note:', messageId);

      // Generate local filename
      const extension = 'm4a';
      const localUri = `${VOICE_CACHE_DIR}${messageId}.${extension}`;

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        remoteUrl,
        localUri,
        {},
        (downloadProgress) => {
          const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          globalDownloadProgress.set(remoteUrl, Math.round(progress));
          if (mountedRef.current) forceUpdate({});
        }
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        throw new Error('Download failed - no URI returned');
      }

      // Cache the result
      globalCache.set(remoteUrl, {
        remoteUrl,
        localUri: result.uri,
        downloadedAt: Date.now(),
      });

      console.log('✅ Voice note downloaded:', messageId);
      return result.uri;
    } catch (error) {
      console.error('❌ Failed to download voice note:', error);
      return null;
    } finally {
      globalDownloading.delete(remoteUrl);
      globalDownloadProgress.delete(remoteUrl);
      if (mountedRef.current) forceUpdate({});
    }
  }, []);

  /**
   * Clear all cached voice notes
   */
  const clearCache = useCallback(async () => {
    try {
      await FileSystem.deleteAsync(VOICE_CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(VOICE_CACHE_DIR, { intermediates: true });
      globalCache.clear();
      console.log('🗑️ Voice cache cleared');
    } catch (error) {
      console.error('Error clearing voice cache:', error);
    }
  }, []);

  return {
    getLocalUri,
    isDownloaded,
    isDownloading,
    getProgress,
    download,
    clearCache,
  };
}

export default useVoiceNoteCache;
