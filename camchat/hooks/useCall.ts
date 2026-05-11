/**
 * useCall Hook
 * Manages Agora RTC engine for voice and video calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { useCallStore } from '../store/callStore';
import {
  getAgoraAppId,
  acceptCall,
  endCall,
  subscribeToCallStatus,
} from '../lib/calls';
import { getUserProfile } from '../lib/contacts';
import type { Call, CallType } from '../types';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Agora App ID
const AGORA_APP_ID = getAgoraAppId();

// Dynamically import Agora (only works in dev client, not Expo Go)
let AgoraModule: typeof import('react-native-agora') | null = null;

// Try to load Agora module
async function loadAgoraModule(): Promise<boolean> {
  if (isExpoGo) {
    console.warn('⚠️ react-native-agora is not available in Expo Go. Please use a development build.');
    return false;
  }

  try {
    AgoraModule = await import('react-native-agora');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to load react-native-agora:', error);
    return false;
  }
}

interface UseCallOptions {
  onCallEnded?: () => void;
  onRemoteUserJoined?: (uid: number) => void;
  onRemoteUserLeft?: (uid: number) => void;
  onError?: (error: string) => void;
}

interface UseCallReturn {
  // State
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  remoteUid: number | null;
  callDuration: number;
  networkQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  isAgoraAvailable: boolean;

  // Actions
  initiateCall: (receiverId: string, type: CallType) => Promise<Call | null>;
  joinCall: (call: Call) => Promise<boolean>;
  leaveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
}

export function useCall(options: UseCallOptions = {}): UseCallReturn {
  const { onCallEnded, onRemoteUserJoined, onRemoteUserLeft, onError } = options;

  // Agora engine ref
  const engineRef = useRef<import('react-native-agora').IRtcEngine | null>(null);

  // Call status subscription
  const statusUnsubscribeRef = useRef<(() => void) | null>(null);

  // Duration timer
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isAgoraAvailable, setIsAgoraAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');

  // Zustand store
  const {
    activeCall,
    isMuted,
    isSpeakerOn,
    isCameraOn,
    callDuration,
    setActiveCall,
    setRemoteUser,
    toggleMute: storeToggleMute,
    toggleSpeaker: storeToggleSpeaker,
    toggleCamera: storeToggleCamera,
    setCallDuration,
    resetCall,
  } = useCallStore();

  // Load Agora module on mount
  useEffect(() => {
    loadAgoraModule().then(setIsAgoraAvailable);
  }, []);

  /**
   * Request permissions for audio/video
   */
  const requestPermissions = useCallback(async (isVideo: boolean): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (isVideo) {
          permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';
        const cameraGranted = !isVideo || granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';

        if (!audioGranted || !cameraGranted) {
          Alert.alert('Permission Required', 'Microphone and camera permissions are required for calls.');
          return false;
        }
      }

      // Configure audio for calls
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: !isSpeakerOn,
      });

      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }, [isSpeakerOn]);

  /**
   * Initialize Agora RTC engine
   */
  const initializeEngine = useCallback(async (isVideo: boolean): Promise<boolean> => {
    if (!isAgoraAvailable || !AgoraModule) {
      onError?.('Agora is not available. Please use a development build instead of Expo Go.');
      return false;
    }

    try {
      if (engineRef.current) {
        console.log('📞 Agora engine already initialized');
        return true;
      }

      console.log('📞 Initializing Agora RTC engine...');
      console.log('📞 App ID:', AGORA_APP_ID.substring(0, 8) + '...');

      // Request permissions first
      const hasPermissions = await requestPermissions(isVideo);
      if (!hasPermissions) {
        return false;
      }

      // Create engine
      const engine = AgoraModule.createAgoraRtcEngine();
      engineRef.current = engine;

      // Initialize with App ID
      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: AgoraModule.ChannelProfileType.ChannelProfileCommunication,
      });

      // Register event handlers
      const eventHandler: import('react-native-agora').IRtcEngineEventHandler = {
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('✅ Joined channel:', connection.channelId, 'elapsed:', elapsed);
          setIsConnected(true);
          setIsConnecting(false);
        },

        onLeaveChannel: (connection, stats) => {
          console.log('👋 Left channel:', connection.channelId);
          setIsConnected(false);
          setRemoteUid(null);
        },

        onUserJoined: (connection, uid, elapsed) => {
          console.log('👤 Remote user joined:', uid);
          setRemoteUid(uid);
          onRemoteUserJoined?.(uid);
        },

        onUserOffline: (connection, uid, reason) => {
          console.log('👤 Remote user left:', uid, 'reason:', reason);
          setRemoteUid(null);
          onRemoteUserLeft?.(uid);
        },

        onError: (err, msg) => {
          console.error('❌ Agora error:', err, msg);
          onError?.(msg);
        },

        onNetworkQuality: (connection, uid, txQuality, rxQuality) => {
          // Map quality levels: 1=excellent, 2=good, 3-4=poor, 5-6=bad
          const quality = Math.max(txQuality, rxQuality);
          if (quality <= 1) setNetworkQuality('excellent');
          else if (quality <= 2) setNetworkQuality('good');
          else if (quality <= 4) setNetworkQuality('poor');
          else setNetworkQuality('unknown');
        },

        onConnectionLost: () => {
          console.warn('⚠️ Connection lost');
          onError?.('Connection lost');
        },

        onConnectionStateChanged: (connection, state, reason) => {
          console.log('📶 Connection state:', state, 'reason:', reason);
        },
      };

      engine.registerEventHandler(eventHandler);

      // Enable audio
      engine.enableAudio();

      // Enable video if it's a video call
      if (isVideo) {
        engine.enableVideo();
        engine.startPreview();
      }

      setIsInitialized(true);
      console.log('✅ Agora engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Agora:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to initialize call');
      return false;
    }
  }, [isAgoraAvailable, requestPermissions, onRemoteUserJoined, onRemoteUserLeft, onError]);

  /**
   * Cleanup Agora engine
   */
  const cleanupEngine = useCallback(async () => {
    try {
      if (engineRef.current) {
        console.log('🧹 Cleaning up Agora engine...');
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
        setIsInitialized(false);
        setIsConnected(false);
        setRemoteUid(null);
      }
    } catch (error) {
      console.error('Error cleaning up Agora:', error);
    }
  }, []);

  /**
   * Initiate a new call
   */
  const initiateCall = useCallback(async (
    receiverId: string,
    type: CallType
  ): Promise<Call | null> => {
    if (!isAgoraAvailable) {
      Alert.alert(
        'Development Build Required',
        'Voice and video calls require a development build. Expo Go does not support native modules like Agora.\n\nPlease build the app with "npx expo run:ios" or "npx expo run:android".'
      );
      return null;
    }

    try {
      setIsConnecting(true);

      // Initialize engine
      const initialized = await initializeEngine(type === 'video');
      if (!initialized) {
        setIsConnecting(false);
        return null;
      }

      // Get receiver profile
      const receiverProfile = await getUserProfile(receiverId);
      if (!receiverProfile) {
        onError?.('Could not find user');
        setIsConnecting(false);
        return null;
      }

      // Create call in Firestore
      const { createCall } = await import('../lib/calls');
      const result = await createCall(
        useCallStore.getState().activeCall?.callerId || '',
        receiverId,
        type
      );

      if (!result.success || !result.call) {
        onError?.(result.error || 'Failed to create call');
        setIsConnecting(false);
        return null;
      }

      const call = result.call;

      // Update store
      setActiveCall(call);
      setRemoteUser(receiverProfile);

      // Subscribe to call status changes
      statusUnsubscribeRef.current = subscribeToCallStatus(call.id, (updatedCall) => {
        setActiveCall(updatedCall);

        if (updatedCall.status === 'ongoing' && !isConnected) {
          // Remote user accepted, join the channel
          joinChannel(updatedCall);
        } else if (['ended', 'declined', 'missed'].includes(updatedCall.status)) {
          // Call ended
          handleCallEnded();
        }
      });

      // Join the channel as caller
      await joinChannel(call);

      return call;
    } catch (error) {
      console.error('Error initiating call:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to initiate call');
      setIsConnecting(false);
      return null;
    }
  }, [isAgoraAvailable, initializeEngine, setActiveCall, setRemoteUser, isConnected, onError]);

  /**
   * Join an existing call (for receiver)
   */
  const joinCall = useCallback(async (call: Call): Promise<boolean> => {
    if (!isAgoraAvailable) {
      Alert.alert(
        'Development Build Required',
        'Voice and video calls require a development build. Expo Go does not support native modules like Agora.'
      );
      return false;
    }

    try {
      setIsConnecting(true);

      // Initialize engine
      const initialized = await initializeEngine(call.type === 'video');
      if (!initialized) {
        setIsConnecting(false);
        return false;
      }

      // Accept the call in Firestore
      const result = await acceptCall(call.id);
      if (!result.success) {
        onError?.(result.error || 'Failed to accept call');
        setIsConnecting(false);
        return false;
      }

      // Update local state
      setActiveCall({ ...call, status: 'ongoing', startedAt: new Date() });

      // Subscribe to call status changes
      statusUnsubscribeRef.current = subscribeToCallStatus(call.id, (updatedCall) => {
        setActiveCall(updatedCall);

        if (['ended', 'declined', 'missed'].includes(updatedCall.status)) {
          handleCallEnded();
        }
      });

      // Join the Agora channel
      await joinChannel(call);

      return true;
    } catch (error) {
      console.error('Error joining call:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to join call');
      setIsConnecting(false);
      return false;
    }
  }, [isAgoraAvailable, initializeEngine, setActiveCall, onError]);

  /**
   * Join Agora channel
   */
  const joinChannel = useCallback(async (call: Call) => {
    if (!engineRef.current || !call.agoraChannelName || !AgoraModule) {
      console.error('Cannot join channel: engine not initialized or no channel name');
      return;
    }

    try {
      console.log('📞 Joining channel:', call.agoraChannelName);

      // Use UID 0 for auto-assign, or use a hash of the user ID
      const uid = 0;

      // Join with token (empty string for no token)
      engineRef.current.joinChannel(
        call.agoraToken || '', // Empty string for no token
        call.agoraChannelName,
        uid,
        {
          clientRoleType: AgoraModule.ClientRoleType.ClientRoleBroadcaster,
          autoSubscribeAudio: true,
          autoSubscribeVideo: call.type === 'video',
        }
      );
    } catch (error) {
      console.error('Error joining channel:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to join channel');
    }
  }, [onError]);

  /**
   * Leave the current call
   */
  const leaveCall = useCallback(async () => {
    try {
      console.log('📞 Leaving call...');

      // Stop duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      // Unsubscribe from status updates
      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current();
        statusUnsubscribeRef.current = null;
      }

      // End call in Firestore
      if (activeCall) {
        await endCall(activeCall.id);
      }

      // Leave Agora channel and cleanup
      await cleanupEngine();

      // Reset store
      resetCall();

      // Notify callback
      onCallEnded?.();
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  }, [activeCall, cleanupEngine, resetCall, onCallEnded]);

  /**
   * Handle call ended (from remote)
   */
  const handleCallEnded = useCallback(() => {
    console.log('📞 Call ended');

    // Stop duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Unsubscribe from status updates
    if (statusUnsubscribeRef.current) {
      statusUnsubscribeRef.current();
      statusUnsubscribeRef.current = null;
    }

    // Cleanup engine
    cleanupEngine();

    // Reset store
    resetCall();

    // Notify callback
    onCallEnded?.();
  }, [cleanupEngine, resetCall, onCallEnded]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (engineRef.current) {
      const newMuted = !isMuted;
      engineRef.current.muteLocalAudioStream(newMuted);
      storeToggleMute();
      console.log('🎤 Mute:', newMuted);
    }
  }, [isMuted, storeToggleMute]);

  /**
   * Toggle speaker
   */
  const toggleSpeaker = useCallback(async () => {
    if (engineRef.current) {
      const newSpeaker = !isSpeakerOn;
      engineRef.current.setEnableSpeakerphone(newSpeaker);
      storeToggleSpeaker();
      console.log('🔊 Speaker:', newSpeaker);
    }
  }, [isSpeakerOn, storeToggleSpeaker]);

  /**
   * Toggle camera (video calls only)
   */
  const toggleCamera = useCallback(() => {
    if (engineRef.current && activeCall?.type === 'video') {
      const newCameraOn = !isCameraOn;
      engineRef.current.enableLocalVideo(newCameraOn);
      storeToggleCamera();
      console.log('📷 Camera:', newCameraOn);
    }
  }, [isCameraOn, activeCall, storeToggleCamera]);

  /**
   * Switch camera (front/back)
   */
  const switchCamera = useCallback(() => {
    if (engineRef.current && activeCall?.type === 'video') {
      engineRef.current.switchCamera();
      console.log('📷 Camera switched');
    }
  }, [activeCall]);

  /**
   * Start call duration timer
   */
  useEffect(() => {
    if (isConnected && activeCall?.status === 'ongoing') {
      // Start timer
      durationTimerRef.current = setInterval(() => {
        setCallDuration(callDuration + 1);
      }, 1000);

      return () => {
        if (durationTimerRef.current) {
          clearInterval(durationTimerRef.current);
        }
      };
    }
  }, [isConnected, activeCall?.status, callDuration, setCallDuration]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanupEngine();

      if (statusUnsubscribeRef.current) {
        statusUnsubscribeRef.current();
      }

      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [cleanupEngine]);

  return {
    // State
    isInitialized,
    isConnecting,
    isConnected,
    remoteUid,
    callDuration,
    networkQuality,
    isAgoraAvailable,

    // Actions
    initiateCall,
    joinCall,
    leaveCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    switchCamera,
  };
}

export default useCall;
