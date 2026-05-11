/**
 * Status Service
 * Handles all status/stories operations with Firestore
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, getServerTimestamp } from './firestore';
import { getUsersByIds } from './contacts';
import type { Status, StatusType, StatusGroup, UserProfile } from '../types';

/**
 * Convert Firestore document to Status type
 */
function firestoreToStatus(docId: string, data: Record<string, unknown>): Status {
  return {
    id: docId,
    userId: data.userId as string,
    type: data.type as StatusType,
    mediaUrl: data.mediaUrl as string | undefined,
    text: data.text as string | undefined,
    backgroundColor: data.backgroundColor as string | undefined,
    caption: data.caption as string | undefined,
    viewedBy: (data.viewedBy as string[]) || [],
    expiresAt: data.expiresAt instanceof Timestamp
      ? data.expiresAt.toDate()
      : new Date(data.expiresAt as string),
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt as string),
  };
}

/**
 * Check if a status has expired (24 hours)
 */
export function isStatusExpired(status: Status): boolean {
  return new Date() > status.expiresAt;
}

/**
 * Filter out expired statuses
 */
export function filterExpiredStatuses(statuses: Status[]): Status[] {
  const now = new Date();
  return statuses.filter(status => status.expiresAt > now);
}

/**
 * Get expiration time (24 hours from now)
 */
export function getStatusExpirationTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Create a new status
 */
export async function createStatus(params: {
  userId: string;
  type: StatusType;
  mediaUrl?: string;
  text?: string;
  backgroundColor?: string;
  caption?: string;
}): Promise<{ success: boolean; status?: Status; error?: string }> {
  try {
    const { userId, type, mediaUrl, text, backgroundColor, caption } = params;

    const statusData: Record<string, unknown> = {
      userId,
      type,
      viewedBy: [],
      createdAt: getServerTimestamp(),
      expiresAt: Timestamp.fromDate(getStatusExpirationTime()),
    };

    if (mediaUrl) statusData.mediaUrl = mediaUrl;
    if (text) statusData.text = text;
    if (backgroundColor) statusData.backgroundColor = backgroundColor;
    if (caption) statusData.caption = caption;

    const statusesRef = collection(db, COLLECTIONS.STATUSES);
    const docRef = await addDoc(statusesRef, statusData);

    console.log('✅ Status created:', docRef.id);

    // Return the created status
    const status: Status = {
      id: docRef.id,
      userId,
      type,
      mediaUrl,
      text,
      backgroundColor,
      caption,
      viewedBy: [],
      createdAt: new Date(),
      expiresAt: getStatusExpirationTime(),
    };

    return { success: true, status };
  } catch (error) {
    console.error('❌ Error creating status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create status',
    };
  }
}

/**
 * Delete a status
 */
export async function deleteStatus(statusId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const statusRef = doc(db, COLLECTIONS.STATUSES, statusId);
    await deleteDoc(statusRef);
    console.log('✅ Status deleted:', statusId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete status',
    };
  }
}

/**
 * Mark a status as viewed
 */
export async function markStatusAsViewed(
  statusId: string,
  viewerId: string
): Promise<void> {
  try {
    const statusRef = doc(db, COLLECTIONS.STATUSES, statusId);
    await updateDoc(statusRef, {
      viewedBy: arrayUnion(viewerId),
    });
    console.log('✅ Status marked as viewed');
  } catch (error) {
    console.error('❌ Error marking status as viewed:', error);
  }
}

/**
 * Get current user's statuses
 */
export async function getMyStatuses(userId: string): Promise<Status[]> {
  try {
    const statusesRef = collection(db, COLLECTIONS.STATUSES);
    const now = Timestamp.now();

    const q = query(
      statusesRef,
      where('userId', '==', userId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const statuses: Status[] = [];

    snapshot.forEach((doc) => {
      statuses.push(firestoreToStatus(doc.id, doc.data()));
    });

    return filterExpiredStatuses(statuses);
  } catch (error) {
    console.error('❌ Error getting my statuses:', error);
    return [];
  }
}

/**
 * Get statuses from contacts
 */
export async function getContactStatuses(
  userId: string,
  contactIds: string[]
): Promise<StatusGroup[]> {
  try {
    if (contactIds.length === 0) return [];

    const statusesRef = collection(db, COLLECTIONS.STATUSES);
    const now = Timestamp.now();

    // Firestore 'in' query limit is 30, so we batch
    const batches: string[][] = [];
    for (let i = 0; i < contactIds.length; i += 30) {
      batches.push(contactIds.slice(i, i + 30));
    }

    const allStatuses: Status[] = [];

    for (const batch of batches) {
      const q = query(
        statusesRef,
        where('userId', 'in', batch),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'asc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        allStatuses.push(firestoreToStatus(doc.id, doc.data()));
      });
    }

    // Filter expired and group by user
    const validStatuses = filterExpiredStatuses(allStatuses);

    // Get user profiles for status owners
    const userIds = [...new Set(validStatuses.map(s => s.userId))];
    const users = await getUsersByIds(userIds);
    const userMap = new Map<string, UserProfile>();

    for (const user of users) {
      userMap.set(user.uid, {
        uid: user.uid,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        about: user.about,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      });
    }

    // Group statuses by user
    const groupMap = new Map<string, Status[]>();
    for (const status of validStatuses) {
      const existing = groupMap.get(status.userId) || [];
      existing.push(status);
      groupMap.set(status.userId, existing);
    }

    // Create StatusGroup array
    const groups: StatusGroup[] = [];
    for (const [statusUserId, statuses] of groupMap) {
      const user = userMap.get(statusUserId);
      if (user) {
        // Sort statuses by createdAt descending
        statuses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Check if any status is unviewed
        const hasUnviewed = statuses.some(s => !s.viewedBy.includes(userId));

        groups.push({
          userId: statusUserId,
          user,
          statuses,
          hasUnviewed,
        });
      }
    }

    // Sort groups: unviewed first, then by most recent status
    groups.sort((a, b) => {
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return b.statuses[0].createdAt.getTime() - a.statuses[0].createdAt.getTime();
    });

    return groups;
  } catch (error) {
    console.error('❌ Error getting contact statuses:', error);
    return [];
  }
}

/**
 * Subscribe to current user's statuses (real-time)
 */
export function subscribeToMyStatuses(
  userId: string,
  callback: (statuses: Status[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const statusesRef = collection(db, COLLECTIONS.STATUSES);
  const now = Timestamp.now();

  const q = query(
    statusesRef,
    where('userId', '==', userId),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'asc'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const statuses: Status[] = [];
      snapshot.forEach((doc) => {
        const status = firestoreToStatus(doc.id, doc.data());
        if (!isStatusExpired(status)) {
          statuses.push(status);
        }
      });
      callback(statuses);
    },
    (error) => {
      console.error('❌ Status subscription error:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Subscribe to contact statuses (real-time)
 */
export function subscribeToContactStatuses(
  userId: string,
  contactIds: string[],
  callback: (groups: StatusGroup[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (contactIds.length === 0) {
    callback([]);
    return () => {};
  }

  const statusesRef = collection(db, COLLECTIONS.STATUSES);
  const now = Timestamp.now();

  // For real-time, we'll listen to the first 30 contacts
  // This is a limitation of Firestore 'in' queries
  const limitedContactIds = contactIds.slice(0, 30);

  const q = query(
    statusesRef,
    where('userId', 'in', limitedContactIds),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'asc'),
    orderBy('createdAt', 'desc')
  );

  // Cache for user profiles
  const userCache = new Map<string, UserProfile>();

  return onSnapshot(
    q,
    async (snapshot) => {
      const statuses: Status[] = [];
      snapshot.forEach((doc) => {
        const status = firestoreToStatus(doc.id, doc.data());
        if (!isStatusExpired(status)) {
          statuses.push(status);
        }
      });

      // Get user profiles for new users
      const userIds = [...new Set(statuses.map(s => s.userId))];
      const missingUserIds = userIds.filter(id => !userCache.has(id));

      if (missingUserIds.length > 0) {
        const users = await getUsersByIds(missingUserIds);
        for (const user of users) {
          userCache.set(user.uid, {
            uid: user.uid,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            about: user.about,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen,
          });
        }
      }

      // Group statuses by user
      const groupMap = new Map<string, Status[]>();
      for (const status of statuses) {
        const existing = groupMap.get(status.userId) || [];
        existing.push(status);
        groupMap.set(status.userId, existing);
      }

      // Create StatusGroup array
      const groups: StatusGroup[] = [];
      for (const [statusUserId, userStatuses] of groupMap) {
        const user = userCache.get(statusUserId);
        if (user) {
          userStatuses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const hasUnviewed = userStatuses.some(s => !s.viewedBy.includes(userId));

          groups.push({
            userId: statusUserId,
            user,
            statuses: userStatuses,
            hasUnviewed,
          });
        }
      }

      // Sort groups
      groups.sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return b.statuses[0].createdAt.getTime() - a.statuses[0].createdAt.getTime();
      });

      callback(groups);
    },
    (error) => {
      console.error('❌ Contact status subscription error:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Get a single status by ID
 */
export async function getStatusById(statusId: string): Promise<Status | null> {
  try {
    const statusRef = doc(db, COLLECTIONS.STATUSES, statusId);
    const snapshot = await getDoc(statusRef);

    if (!snapshot.exists()) {
      return null;
    }

    const status = firestoreToStatus(snapshot.id, snapshot.data());
    return isStatusExpired(status) ? null : status;
  } catch (error) {
    console.error('❌ Error getting status:', error);
    return null;
  }
}

/**
 * Get all statuses for a specific user
 */
export async function getUserStatuses(targetUserId: string): Promise<Status[]> {
  try {
    const statusesRef = collection(db, COLLECTIONS.STATUSES);
    const now = Timestamp.now();

    const q = query(
      statusesRef,
      where('userId', '==', targetUserId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const statuses: Status[] = [];

    snapshot.forEach((doc) => {
      const status = firestoreToStatus(doc.id, doc.data());
      if (!isStatusExpired(status)) {
        statuses.push(status);
      }
    });

    return statuses;
  } catch (error) {
    console.error('❌ Error getting user statuses:', error);
    return [];
  }
}
