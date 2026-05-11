/**
 * useCallHistory Hook
 * Fetches and manages call history for the current user
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  or,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUsersByIds } from '../lib/contacts';
import { calculateCallDuration } from '../lib/calls';
import { useAuthStore } from '../store/authStore';
import type { Call, CallLog, UserProfile } from '../types';

interface UseCallHistoryReturn {
  callLogs: CallLog[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCallHistory(limitCount: number = 50): UseCallHistoryReturn {
  const { user } = useAuthStore();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User profiles cache
  const [profileCache, setProfileCache] = useState<Map<string, UserProfile>>(new Map());

  // Fetch user profiles for a list of IDs
  const fetchProfiles = useCallback(async (userIds: string[]): Promise<Map<string, UserProfile>> => {
    const missingIds = userIds.filter((id) => !profileCache.has(id));

    if (missingIds.length === 0) {
      return profileCache;
    }

    try {
      const users = await getUsersByIds(missingIds);
      const newCache = new Map(profileCache);

      users.forEach((u) => {
        const profile: UserProfile = {
          uid: u.uid,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          about: u.about,
          isOnline: u.isOnline,
          lastSeen: u.lastSeen,
        };
        newCache.set(u.uid, profile);
      });

      setProfileCache(newCache);
      return newCache;
    } catch (err) {
      console.error('Error fetching profiles:', err);
      return profileCache;
    }
  }, [profileCache]);

  // Convert Call to CallLog with profiles
  const enrichCallWithProfiles = useCallback(
    async (calls: Call[], profiles: Map<string, UserProfile>): Promise<CallLog[]> => {
      return calls.map((call) => {
        const callerProfile = profiles.get(call.callerId) || {
          uid: call.callerId,
          displayName: 'Unknown',
          avatarUrl: '',
          about: '',
          isOnline: false,
          lastSeen: new Date(),
        };

        const receiverProfile = profiles.get(call.receiverId) || {
          uid: call.receiverId,
          displayName: 'Unknown',
          avatarUrl: '',
          about: '',
          isOnline: false,
          lastSeen: new Date(),
        };

        return {
          ...call,
          callerProfile,
          receiverProfile,
          duration: calculateCallDuration(call),
        };
      });
    },
    []
  );

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    setError(null);

    try {
      const callsCollection = collection(db, 'calls');
      const q = query(
        callsCollection,
        or(
          where('callerId', '==', user.uid),
          where('receiverId', '==', user.uid)
        ),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Get snapshot once
      const { getDocs } = await import('firebase/firestore');
      const snapshot = await getDocs(q);

      const calls: Call[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        calls.push({
          id: docSnapshot.id,
          callerId: data.callerId,
          receiverId: data.receiverId,
          type: data.type,
          status: data.status,
          agoraChannelName: data.agoraChannelName,
          agoraToken: data.agoraToken,
          startedAt: data.startedAt?.toDate(),
          endedAt: data.endedAt?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });

      // Fetch profiles for all users
      const userIds = new Set<string>();
      calls.forEach((call) => {
        userIds.add(call.callerId);
        userIds.add(call.receiverId);
      });

      const profiles = await fetchProfiles(Array.from(userIds));
      const enrichedLogs = await enrichCallWithProfiles(calls, profiles);
      setCallLogs(enrichedLogs);
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch call history');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, limitCount, fetchProfiles, enrichCallWithProfiles]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const callsCollection = collection(db, 'calls');
    const q = query(
      callsCollection,
      or(
        where('callerId', '==', user.uid),
        where('receiverId', '==', user.uid)
      ),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const calls: Call[] = [];
          snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            calls.push({
              id: docSnapshot.id,
              callerId: data.callerId,
              receiverId: data.receiverId,
              type: data.type,
              status: data.status,
              agoraChannelName: data.agoraChannelName,
              agoraToken: data.agoraToken,
              startedAt: data.startedAt?.toDate(),
              endedAt: data.endedAt?.toDate(),
              createdAt: data.createdAt?.toDate() || new Date(),
            });
          });

          // Fetch profiles for all users
          const userIds = new Set<string>();
          calls.forEach((call) => {
            userIds.add(call.callerId);
            userIds.add(call.receiverId);
          });

          const profiles = await fetchProfiles(Array.from(userIds));
          const enrichedLogs = await enrichCallWithProfiles(calls, profiles);
          setCallLogs(enrichedLogs);
          setError(null);
        } catch (err) {
          console.error('Error processing call history:', err);
          setError(err instanceof Error ? err.message : 'Failed to process call history');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Call history subscription error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, limitCount, fetchProfiles, enrichCallWithProfiles]);

  return {
    callLogs,
    isLoading,
    error,
    refresh,
  };
}

export default useCallHistory;
