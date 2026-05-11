/**
 * Call Operations
 * Handles CRUD operations for calls and Agora channel management
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  getDocs,
  or,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Call, CallType, CallStatus, CallLog, UserProfile } from '../types';

// Agora App ID from environment
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || 'db2e4a2c37c048e798990860eaeb3509';

// Collection reference
const callsCollection = collection(db, 'calls');

/**
 * Generate a unique channel name for Agora
 */
export function generateChannelName(callerId: string, receiverId: string): string {
  const timestamp = Date.now();
  // Sort IDs to ensure consistent channel name for same participants
  const sortedIds = [callerId, receiverId].sort();
  return `call_${sortedIds[0]}_${sortedIds[1]}_${timestamp}`;
}

/**
 * Get Agora App ID
 */
export function getAgoraAppId(): string {
  return AGORA_APP_ID;
}

/**
 * Create a new call document in Firestore
 */
export async function createCall(
  callerId: string,
  receiverId: string,
  type: CallType
): Promise<{ success: boolean; call?: Call; error?: string }> {
  try {
    const callId = doc(callsCollection).id;
    const channelName = generateChannelName(callerId, receiverId);

    const call: Call = {
      id: callId,
      callerId,
      receiverId,
      type,
      status: 'ringing',
      agoraChannelName: channelName,
      createdAt: new Date(),
    };

    // Build Firestore document - exclude undefined fields
    const firestoreDoc: Record<string, unknown> = {
      id: callId,
      callerId,
      receiverId,
      type,
      status: 'ringing',
      agoraChannelName: channelName,
      createdAt: Timestamp.fromDate(call.createdAt),
    };

    await setDoc(doc(callsCollection, callId), firestoreDoc);

    console.log('📞 Call created:', callId);
    return { success: true, call };
  } catch (error) {
    console.error('❌ Error creating call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create call',
    };
  }
}

/**
 * Get a call by ID
 */
export async function getCallById(
  callId: string
): Promise<{ success: boolean; call?: Call; error?: string }> {
  try {
    const callDoc = await getDoc(doc(callsCollection, callId));

    if (!callDoc.exists()) {
      return { success: false, error: 'Call not found' };
    }

    const data = callDoc.data();
    const call: Call = {
      id: callDoc.id,
      callerId: data.callerId,
      receiverId: data.receiverId,
      type: data.type,
      status: data.status,
      agoraChannelName: data.agoraChannelName,
      agoraToken: data.agoraToken,
      startedAt: data.startedAt?.toDate(),
      endedAt: data.endedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
    };

    return { success: true, call };
  } catch (error) {
    console.error('❌ Error getting call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get call',
    };
  }
}

/**
 * Update call status
 */
export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  additionalData?: { startedAt?: Date; endedAt?: Date }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = { status };

    if (additionalData?.startedAt) {
      updateData.startedAt = Timestamp.fromDate(additionalData.startedAt);
    }
    if (additionalData?.endedAt) {
      updateData.endedAt = Timestamp.fromDate(additionalData.endedAt);
    }

    await updateDoc(doc(callsCollection, callId), updateData);
    console.log('📞 Call status updated:', callId, status);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating call status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update call status',
    };
  }
}

/**
 * Accept a call - set status to ongoing and record start time
 */
export async function acceptCall(
  callId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCallStatus(callId, 'ongoing', { startedAt: new Date() });
}

/**
 * Decline a call
 */
export async function declineCall(
  callId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCallStatus(callId, 'declined', { endedAt: new Date() });
}

/**
 * End a call
 */
export async function endCall(
  callId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCallStatus(callId, 'ended', { endedAt: new Date() });
}

/**
 * Mark call as missed
 */
export async function missCall(
  callId: string
): Promise<{ success: boolean; error?: string }> {
  return updateCallStatus(callId, 'missed', { endedAt: new Date() });
}

/**
 * Listen for incoming calls
 */
export function subscribeToIncomingCalls(
  userId: string,
  onCall: (call: Call) => void
): () => void {
  const q = query(
    callsCollection,
    where('receiverId', '==', userId),
    where('status', '==', 'ringing'),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const call: Call = {
          id: change.doc.id,
          callerId: data.callerId,
          receiverId: data.receiverId,
          type: data.type,
          status: data.status,
          agoraChannelName: data.agoraChannelName,
          agoraToken: data.agoraToken,
          createdAt: data.createdAt?.toDate() || new Date(),
        };
        console.log('📱 Incoming call detected:', call.id);
        onCall(call);
      }
    });
  });

  return unsubscribe;
}

/**
 * Subscribe to call status changes
 */
export function subscribeToCallStatus(
  callId: string,
  onStatusChange: (call: Call) => void
): () => void {
  const unsubscribe = onSnapshot(doc(callsCollection, callId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const call: Call = {
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
      };
      onStatusChange(call);
    }
  });

  return unsubscribe;
}

/**
 * Get call history for a user
 */
export async function getCallHistory(
  userId: string,
  limitCount: number = 50
): Promise<{ success: boolean; calls?: Call[]; error?: string }> {
  try {
    // Query for calls where user is either caller or receiver
    const q = query(
      callsCollection,
      or(
        where('callerId', '==', userId),
        where('receiverId', '==', userId)
      ),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

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

    return { success: true, calls };
  } catch (error) {
    console.error('❌ Error getting call history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get call history',
    };
  }
}

/**
 * Calculate call duration in seconds
 */
export function calculateCallDuration(call: Call): number {
  if (!call.startedAt || !call.endedAt) return 0;
  return Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
}

/**
 * Format call duration for display
 */
export function formatCallDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default {
  getAgoraAppId,
  generateChannelName,
  createCall,
  getCallById,
  updateCallStatus,
  acceptCall,
  declineCall,
  endCall,
  missCall,
  subscribeToIncomingCalls,
  subscribeToCallStatus,
  getCallHistory,
  calculateCallDuration,
  formatCallDuration,
};
