/**
 * Call Signaling Service
 * Handles real-time call signaling via Firestore
 * Manages incoming call detection, call state updates, and notifications
 */

import { useEffect, useCallback, useRef } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import {
  subscribeToIncomingCalls,
  subscribeToCallStatus,
  acceptCall as acceptCallInFirestore,
  declineCall as declineCallInFirestore,
  endCall as endCallInFirestore,
  missCall as missCallInFirestore,
} from './calls';
import { getUserProfile } from './contacts';
import { useCallStore } from '../store/callStore';
import type { Call, UserProfile } from '../types';

// Ringtone timeout (30 seconds)
const RINGTONE_TIMEOUT = 30000;

// Vibration pattern: vibrate 1s, pause 1s, repeat
const VIBRATION_PATTERN = Platform.OS === 'android' ? [0, 1000, 1000] : [1000];

/**
 * Call Signaling Manager
 * Singleton class to manage call signaling state
 */
class CallSignalingManager {
  private static instance: CallSignalingManager;
  private incomingCallUnsubscribe: (() => void) | null = null;
  private callStatusUnsubscribe: (() => void) | null = null;
  private ringtoneSound: Audio.Sound | null = null;
  private ringtoneTimeout: NodeJS.Timeout | null = null;
  private currentUserId: string | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): CallSignalingManager {
    if (!CallSignalingManager.instance) {
      CallSignalingManager.instance = new CallSignalingManager();
    }
    return CallSignalingManager.instance;
  }

  /**
   * Initialize call signaling for a user
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized && this.currentUserId === userId) {
      console.log('📞 Call signaling already initialized for user:', userId);
      return;
    }

    // Cleanup previous subscription if any
    this.cleanup();

    this.currentUserId = userId;
    this.isInitialized = true;

    console.log('📞 Initializing call signaling for user:', userId);

    // Subscribe to incoming calls
    this.incomingCallUnsubscribe = subscribeToIncomingCalls(
      userId,
      this.handleIncomingCall.bind(this)
    );
  }

  /**
   * Handle incoming call
   */
  private async handleIncomingCall(call: Call): Promise<void> {
    console.log('📱 Handling incoming call:', call.id, 'from:', call.callerId);

    try {
      // Get caller profile
      const callerProfile = await getUserProfile(call.callerId);
      if (!callerProfile) {
        console.error('Could not get caller profile');
        return;
      }

      // Update call store
      const callStore = useCallStore.getState();
      callStore.setActiveCall(call);
      callStore.setRemoteUser(callerProfile);

      // Start ringtone and vibration
      await this.startRingtone();
      this.startVibration();

      // Set timeout to mark call as missed
      this.ringtoneTimeout = setTimeout(() => {
        this.handleMissedCall(call.id);
      }, RINGTONE_TIMEOUT);

      // Subscribe to call status changes
      this.subscribeToCallChanges(call.id);

      // Navigate to call screen
      router.push({
        pathname: '/call/[callId]',
        params: { callId: call.id, isIncoming: 'true' },
      });
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  }

  /**
   * Subscribe to call status changes
   */
  private subscribeToCallChanges(callId: string): void {
    // Unsubscribe from previous if any
    if (this.callStatusUnsubscribe) {
      this.callStatusUnsubscribe();
    }

    this.callStatusUnsubscribe = subscribeToCallStatus(callId, (call) => {
      console.log('📞 Call status changed:', call.status);

      const callStore = useCallStore.getState();
      callStore.setActiveCall(call);

      // Handle status changes
      switch (call.status) {
        case 'ongoing':
          // Call was accepted, stop ringtone
          this.stopRingtone();
          this.stopVibration();
          this.clearRingtoneTimeout();
          break;

        case 'ended':
        case 'declined':
        case 'missed':
          // Call ended, cleanup
          this.stopRingtone();
          this.stopVibration();
          this.clearRingtoneTimeout();
          callStore.resetCall();

          // Navigate back if we're on call screen
          if (router.canGoBack()) {
            router.back();
          }
          break;
      }
    });
  }

  /**
   * Handle missed call
   */
  private async handleMissedCall(callId: string): Promise<void> {
    console.log('📞 Call missed:', callId);

    await missCallInFirestore(callId);
    this.stopRingtone();
    this.stopVibration();

    const callStore = useCallStore.getState();
    callStore.resetCall();
  }

  /**
   * Accept incoming call
   */
  async acceptIncomingCall(callId: string): Promise<boolean> {
    console.log('📞 Accepting call:', callId);

    this.stopRingtone();
    this.stopVibration();
    this.clearRingtoneTimeout();

    const result = await acceptCallInFirestore(callId);
    return result.success;
  }

  /**
   * Decline incoming call
   */
  async declineIncomingCall(callId: string): Promise<boolean> {
    console.log('📞 Declining call:', callId);

    this.stopRingtone();
    this.stopVibration();
    this.clearRingtoneTimeout();

    const result = await declineCallInFirestore(callId);

    if (result.success) {
      const callStore = useCallStore.getState();
      callStore.resetCall();
    }

    return result.success;
  }

  /**
   * End active call
   */
  async endActiveCall(callId: string): Promise<boolean> {
    console.log('📞 Ending call:', callId);

    this.stopRingtone();
    this.stopVibration();
    this.clearRingtoneTimeout();

    const result = await endCallInFirestore(callId);

    if (result.success) {
      const callStore = useCallStore.getState();
      callStore.resetCall();
    }

    return result.success;
  }

  /**
   * Start ringtone
   */
  private async startRingtone(): Promise<void> {
    try {
      // Configure audio mode for ringtone
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // For now, we'll rely on vibration since we don't have a ringtone file
      // In production, add a custom ringtone file:
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../assets/sounds/ringtone.mp3'),
      //   { isLooping: true, volume: 1.0 }
      // );
      // this.ringtoneSound = sound;
      // await sound.playAsync();
      console.log('🔔 Ringtone would play here (vibration fallback)');
    } catch (error) {
      console.warn('Could not play ringtone:', error);
      // Fallback: use system vibration only
    }
  }

  /**
   * Stop ringtone
   */
  private async stopRingtone(): Promise<void> {
    try {
      if (this.ringtoneSound) {
        await this.ringtoneSound.stopAsync();
        await this.ringtoneSound.unloadAsync();
        this.ringtoneSound = null;
        console.log('🔕 Ringtone stopped');
      }
    } catch (error) {
      console.warn('Error stopping ringtone:', error);
    }
  }

  /**
   * Start vibration
   */
  private startVibration(): void {
    if (Platform.OS === 'android') {
      Vibration.vibrate(VIBRATION_PATTERN, true);
    } else {
      // iOS doesn't support continuous vibration, use single vibration
      Vibration.vibrate(VIBRATION_PATTERN);
    }
  }

  /**
   * Stop vibration
   */
  private stopVibration(): void {
    Vibration.cancel();
  }

  /**
   * Clear ringtone timeout
   */
  private clearRingtoneTimeout(): void {
    if (this.ringtoneTimeout) {
      clearTimeout(this.ringtoneTimeout);
      this.ringtoneTimeout = null;
    }
  }

  /**
   * Cleanup all subscriptions and resources
   */
  cleanup(): void {
    console.log('📞 Cleaning up call signaling');

    if (this.incomingCallUnsubscribe) {
      this.incomingCallUnsubscribe();
      this.incomingCallUnsubscribe = null;
    }

    if (this.callStatusUnsubscribe) {
      this.callStatusUnsubscribe();
      this.callStatusUnsubscribe = null;
    }

    this.stopRingtone();
    this.stopVibration();
    this.clearRingtoneTimeout();

    this.currentUserId = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const callSignaling = CallSignalingManager.getInstance();

/**
 * Hook to initialize call signaling
 */
export function useCallSignaling(userId: string | undefined): void {
  const initialized = useRef(false);

  useEffect(() => {
    if (!userId) return;

    if (!initialized.current) {
      callSignaling.initialize(userId);
      initialized.current = true;
    }

    return () => {
      // Don't cleanup on unmount - signaling should persist
      // Cleanup is handled when user logs out
    };
  }, [userId]);
}

/**
 * Accept an incoming call
 */
export async function acceptIncomingCall(callId: string): Promise<boolean> {
  return callSignaling.acceptIncomingCall(callId);
}

/**
 * Decline an incoming call
 */
export async function declineIncomingCall(callId: string): Promise<boolean> {
  return callSignaling.declineIncomingCall(callId);
}

/**
 * End the active call
 */
export async function endActiveCall(callId: string): Promise<boolean> {
  return callSignaling.endActiveCall(callId);
}

/**
 * Cleanup call signaling (call on logout)
 */
export function cleanupCallSignaling(): void {
  callSignaling.cleanup();
}

export default callSignaling;
