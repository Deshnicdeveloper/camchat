/**
 * useNotifications Hook
 * Provides notification state and actions for components
 */

import { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  registerPushToken,
  requestNotificationPermissions,
  clearAllNotifications,
  setBadgeCount,
} from '../lib/notifications';

interface UseNotificationsReturn {
  hasPermission: boolean;
  isRegistering: boolean;
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<string | null>;
  clearNotifications: () => Promise<void>;
  updateBadgeCount: (count: number) => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuthStore();
  const [hasPermission, setHasPermission] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await import('expo-notifications').then((mod) =>
        mod.getPermissionsAsync()
      );
      setHasPermission(status === 'granted');
    } catch {
      setHasPermission(false);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
    return granted;
  }, []);

  const registerToken = useCallback(async (): Promise<string | null> => {
    if (!user?.uid) return null;

    setIsRegistering(true);
    try {
      const token = await registerPushToken(user.uid);
      return token;
    } finally {
      setIsRegistering(false);
    }
  }, [user?.uid]);

  const clearNotifications = useCallback(async () => {
    await clearAllNotifications();
  }, []);

  const updateBadgeCount = useCallback(async (count: number) => {
    await setBadgeCount(count);
  }, []);

  return {
    hasPermission,
    isRegistering,
    requestPermission,
    registerToken,
    clearNotifications,
    updateBadgeCount,
  };
}

export default useNotifications;
