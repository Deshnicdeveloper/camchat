/**
 * useContacts Hook
 * Handles contact sync and provides synced contacts list
 */

import { useEffect, useCallback, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import {
  syncContacts,
  requestContactsPermission,
  hasContactsPermission,
  getUsersByIds,
} from '../lib/contacts';
import type { Contact, User } from '../types';

interface UseContactsReturn {
  // State
  contacts: Contact[];
  registeredContacts: User[];
  isLoading: boolean;
  isSyncing: boolean;
  hasPermission: boolean;
  error: string | null;

  // Actions
  sync: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  getContactByUserId: (userId: string) => Contact | undefined;
  getContactByPhone: (phone: string) => Contact | undefined;
}

export function useContacts(): UseContactsReturn {
  const { user } = useAuthStore();
  const { contacts: storeContacts, setContacts, setLoading } = useChatStore();

  const [registeredContacts, setRegisteredContacts] = useState<User[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const granted = await hasContactsPermission();
      setHasPermission(granted);
      setIsLoading(false);
    };

    checkPermission();
  }, []);

  // Auto-sync contacts when user logs in and has permission
  useEffect(() => {
    if (user?.uid && hasPermission && storeContacts.length === 0) {
      sync();
    }
  }, [user?.uid, hasPermission]);

  // Load registered user details from user's contacts array
  useEffect(() => {
    const loadRegisteredContacts = async () => {
      if (user?.contacts && user.contacts.length > 0) {
        const users = await getUsersByIds(user.contacts);
        setRegisteredContacts(users);
      }
    };

    loadRegisteredContacts();
  }, [user?.contacts]);

  /**
   * Request contacts permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestContactsPermission();
    setHasPermission(granted);
    return granted;
  }, []);

  /**
   * Sync contacts with device
   */
  const sync = useCallback(async (): Promise<void> => {
    if (!user?.uid) {
      setError('User not authenticated');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      // Request permission if not already granted
      let granted = hasPermission;
      if (!granted) {
        granted = await requestPermission();
        if (!granted) {
          setError('Contacts permission required');
          setIsSyncing(false);
          return;
        }
      }

      // Sync contacts
      const result = await syncContacts(user.uid);

      if (result.success) {
        setContacts(result.contacts);

        // Also update registered contacts
        const userIds = result.contacts
          .filter((c) => c.isRegistered && c.userId)
          .map((c) => c.userId as string);

        if (userIds.length > 0) {
          const users = await getUsersByIds(userIds);
          setRegisteredContacts(users);
        }
      } else {
        setError(result.error || 'Failed to sync contacts');
      }
    } catch (err) {
      console.error('Error syncing contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync contacts');
    } finally {
      setIsSyncing(false);
    }
  }, [user?.uid, hasPermission, requestPermission, setContacts]);

  /**
   * Get a contact by user ID
   */
  const getContactByUserId = useCallback(
    (userId: string): Contact | undefined => {
      return storeContacts.find((c) => c.userId === userId);
    },
    [storeContacts]
  );

  /**
   * Get a contact by phone number
   */
  const getContactByPhone = useCallback(
    (phone: string): Contact | undefined => {
      return storeContacts.find((c) => c.phone === phone);
    },
    [storeContacts]
  );

  return {
    contacts: storeContacts,
    registeredContacts,
    isLoading,
    isSyncing,
    hasPermission,
    error,
    sync,
    requestPermission,
    getContactByUserId,
    getContactByPhone,
  };
}

export default useContacts;
