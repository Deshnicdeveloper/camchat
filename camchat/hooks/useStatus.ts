/**
 * useStatus Hook
 * Handles status/stories state management and operations
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useStatusStore } from '../store/statusStore';
import { useChatStore } from '../store/chatStore';
import {
  createStatus,
  deleteStatus,
  markStatusAsViewed,
  subscribeToMyStatuses,
  subscribeToContactStatuses,
  getUserStatuses,
} from '../lib/status';
import { uploadStatusMediaFromUri } from '../lib/storage';
import type { Status, StatusType, StatusGroup } from '../types';

interface UseStatusReturn {
  // State
  myStatuses: Status[];
  contactStatuses: StatusGroup[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createImageStatus: (imageUri: string, caption?: string) => Promise<boolean>;
  createVideoStatus: (videoUri: string, caption?: string) => Promise<boolean>;
  createTextStatus: (text: string, backgroundColor: string) => Promise<boolean>;
  removeStatus: (statusId: string) => Promise<boolean>;
  markAsViewed: (statusId: string) => Promise<void>;
  getStatusesForUser: (userId: string) => Promise<Status[]>;
  refreshStatuses: () => Promise<void>;
}

export function useStatus(): UseStatusReturn {
  const { user } = useAuthStore();
  const { contacts } = useChatStore();
  const {
    myStatuses,
    contactStatuses,
    isLoading,
    setMyStatuses,
    addMyStatus,
    removeMyStatus,
    setContactStatuses,
    markStatusViewed,
    setLoading,
  } = useStatusStore();

  const [error, setError] = useState<string | null>(null);
  const unsubscribeMyStatusesRef = useRef<(() => void) | null>(null);
  const unsubscribeContactStatusesRef = useRef<(() => void) | null>(null);

  // Subscribe to my statuses
  useEffect(() => {
    if (!user?.uid) {
      setMyStatuses([]);
      return;
    }

    console.log('📡 Subscribing to my statuses');

    if (unsubscribeMyStatusesRef.current) {
      unsubscribeMyStatusesRef.current();
    }

    unsubscribeMyStatusesRef.current = subscribeToMyStatuses(
      user.uid,
      (statuses) => {
        console.log('📨 Received my statuses update:', statuses.length);
        setMyStatuses(statuses);
      },
      (err) => {
        console.error('❌ My statuses subscription error:', err);
        setError(err.message);
      }
    );

    return () => {
      if (unsubscribeMyStatusesRef.current) {
        console.log('📴 Unsubscribing from my statuses');
        unsubscribeMyStatusesRef.current();
        unsubscribeMyStatusesRef.current = null;
      }
    };
  }, [user?.uid, setMyStatuses]);

  // Subscribe to contact statuses
  useEffect(() => {
    if (!user?.uid) {
      setContactStatuses([]);
      return;
    }

    // Get contact user IDs
    const contactIds = contacts.map(c => c.userId).filter(Boolean);

    console.log('📡 Subscribing to contact statuses:', contactIds.length, 'contacts');

    if (unsubscribeContactStatusesRef.current) {
      unsubscribeContactStatusesRef.current();
    }

    setLoading(true);

    unsubscribeContactStatusesRef.current = subscribeToContactStatuses(
      user.uid,
      contactIds,
      (groups) => {
        console.log('📨 Received contact statuses update:', groups.length, 'groups');
        setContactStatuses(groups);
        setLoading(false);
      },
      (err) => {
        console.error('❌ Contact statuses subscription error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeContactStatusesRef.current) {
        console.log('📴 Unsubscribing from contact statuses');
        unsubscribeContactStatusesRef.current();
        unsubscribeContactStatusesRef.current = null;
      }
    };
  }, [user?.uid, contacts, setContactStatuses, setLoading]);

  /**
   * Create an image status
   */
  const createImageStatus = useCallback(
    async (imageUri: string, caption?: string): Promise<boolean> => {
      if (!user?.uid) return false;

      setError(null);

      try {
        // Upload image to Supabase
        console.log('📤 Uploading status image...');
        const uploadResult = await uploadStatusMediaFromUri(user.uid, imageUri, false);

        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || 'Failed to upload image');
          return false;
        }

        // Create status document
        const result = await createStatus({
          userId: user.uid,
          type: 'image',
          mediaUrl: uploadResult.url,
          caption,
        });

        if (!result.success) {
          setError(result.error || 'Failed to create status');
          return false;
        }

        if (result.status) {
          addMyStatus(result.status);
        }

        console.log('✅ Image status created');
        return true;
      } catch (err) {
        console.error('❌ Error creating image status:', err);
        setError(err instanceof Error ? err.message : 'Failed to create status');
        return false;
      }
    },
    [user?.uid, addMyStatus]
  );

  /**
   * Create a video status
   */
  const createVideoStatus = useCallback(
    async (videoUri: string, caption?: string): Promise<boolean> => {
      if (!user?.uid) return false;

      setError(null);

      try {
        // Upload video to Supabase
        console.log('📤 Uploading status video...');
        const uploadResult = await uploadStatusMediaFromUri(user.uid, videoUri, true);

        if (!uploadResult.success || !uploadResult.url) {
          setError(uploadResult.error || 'Failed to upload video');
          return false;
        }

        // Create status document
        const result = await createStatus({
          userId: user.uid,
          type: 'video',
          mediaUrl: uploadResult.url,
          caption,
        });

        if (!result.success) {
          setError(result.error || 'Failed to create status');
          return false;
        }

        if (result.status) {
          addMyStatus(result.status);
        }

        console.log('✅ Video status created');
        return true;
      } catch (err) {
        console.error('❌ Error creating video status:', err);
        setError(err instanceof Error ? err.message : 'Failed to create status');
        return false;
      }
    },
    [user?.uid, addMyStatus]
  );

  /**
   * Create a text status
   */
  const createTextStatus = useCallback(
    async (text: string, backgroundColor: string): Promise<boolean> => {
      if (!user?.uid) return false;

      setError(null);

      try {
        const result = await createStatus({
          userId: user.uid,
          type: 'text',
          text,
          backgroundColor,
        });

        if (!result.success) {
          setError(result.error || 'Failed to create status');
          return false;
        }

        if (result.status) {
          addMyStatus(result.status);
        }

        console.log('✅ Text status created');
        return true;
      } catch (err) {
        console.error('❌ Error creating text status:', err);
        setError(err instanceof Error ? err.message : 'Failed to create status');
        return false;
      }
    },
    [user?.uid, addMyStatus]
  );

  /**
   * Delete a status
   */
  const removeStatus = useCallback(
    async (statusId: string): Promise<boolean> => {
      setError(null);

      try {
        const result = await deleteStatus(statusId);

        if (!result.success) {
          setError(result.error || 'Failed to delete status');
          return false;
        }

        removeMyStatus(statusId);
        console.log('✅ Status deleted');
        return true;
      } catch (err) {
        console.error('❌ Error deleting status:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete status');
        return false;
      }
    },
    [removeMyStatus]
  );

  /**
   * Mark a status as viewed
   */
  const markAsViewed = useCallback(
    async (statusId: string): Promise<void> => {
      if (!user?.uid) return;

      try {
        await markStatusAsViewed(statusId, user.uid);
        markStatusViewed(statusId, user.uid);
      } catch (err) {
        console.error('❌ Error marking status as viewed:', err);
      }
    },
    [user?.uid, markStatusViewed]
  );

  /**
   * Get statuses for a specific user
   */
  const getStatusesForUser = useCallback(
    async (userId: string): Promise<Status[]> => {
      try {
        return await getUserStatuses(userId);
      } catch (err) {
        console.error('❌ Error getting user statuses:', err);
        return [];
      }
    },
    []
  );

  /**
   * Manually refresh statuses
   */
  const refreshStatuses = useCallback(async (): Promise<void> => {
    // The subscriptions handle real-time updates,
    // but this can be called to force a refresh
    console.log('🔄 Refreshing statuses...');
    // Statuses will be updated via subscriptions
  }, []);

  return {
    myStatuses,
    contactStatuses,
    isLoading,
    error,
    createImageStatus,
    createVideoStatus,
    createTextStatus,
    removeStatus,
    markAsViewed,
    getStatusesForUser,
    refreshStatuses,
  };
}

export default useStatus;
