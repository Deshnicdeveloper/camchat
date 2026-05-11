/**
 * useVoiceRecorder Hook
 * Handles voice note recording with expo-av
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface VoiceRecorderState {
  isRecording: boolean;
  isLocked: boolean;
  duration: number;
  metering: number[]; // Audio level samples for waveform
  uri: string | null;
  error: string | null;
}

interface UseVoiceRecorderReturn extends VoiceRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<{ uri: string; duration: number } | null>;
  cancelRecording: () => Promise<void>;
  lockRecording: () => void;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
}

const METERING_INTERVAL = 100; // ms between metering samples
const MAX_METERING_SAMPLES = 50; // Number of waveform bars

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isLocked: false,
    duration: 0,
    metering: [],
    uri: null,
    error: null,
  });

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
    };
  }, []);

  /**
   * Request audio recording permissions
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      // Request permissions
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        setState((prev) => ({ ...prev, error: 'Microphone permission required' }));
        return;
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Update metering from status
          if (status.isRecording && status.metering !== undefined) {
            setState((prev) => {
              const newMetering = [...prev.metering, normalizeMetering(status.metering!)];
              // Keep only last MAX_METERING_SAMPLES
              if (newMetering.length > MAX_METERING_SAMPLES) {
                newMetering.shift();
              }
              return { ...prev, metering: newMetering };
            });
          }
        },
        METERING_INTERVAL
      );

      recordingRef.current = recording;
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState((prev) => ({ ...prev, duration: elapsed }));
      }, 1000);

      setState({
        isRecording: true,
        isLocked: false,
        duration: 0,
        metering: [],
        uri: null,
        error: null,
      });

      console.log('🎙️ Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording',
      }));
    }
  }, [requestPermissions]);

  /**
   * Stop recording and return the recorded audio
   */
  const stopRecording = useCallback(async (): Promise<{ uri: string; duration: number } | null> => {
    try {
      if (!recordingRef.current) {
        return null;
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Clear intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setState({
        isRecording: false,
        isLocked: false,
        duration: 0,
        metering: [],
        uri: uri || null,
        error: null,
      });

      console.log('🎙️ Recording stopped:', uri, 'Duration:', duration);

      if (uri) {
        return { uri, duration };
      }
      return null;
    } catch (error) {
      console.error('Error stopping recording:', error);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording',
      }));
      return null;
    }
  }, []);

  /**
   * Cancel recording without saving
   */
  const cancelRecording = useCallback(async () => {
    try {
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      // Clear intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      setState({
        isRecording: false,
        isLocked: false,
        duration: 0,
        metering: [],
        uri: null,
        error: null,
      });

      console.log('🎙️ Recording cancelled');
    } catch (error) {
      console.error('Error cancelling recording:', error);
    }
  }, []);

  /**
   * Lock recording (hands-free mode)
   */
  const lockRecording = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setState((prev) => ({ ...prev, isLocked: true }));
    console.log('🔒 Recording locked');
  }, []);

  /**
   * Pause recording
   */
  const pauseRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.pauseAsync();
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.startAsync();
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
    }
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    lockRecording,
    pauseRecording,
    resumeRecording,
  };
}

/**
 * Normalize metering value to 0-1 range
 * expo-av metering is in dB, typically -160 to 0
 */
function normalizeMetering(dB: number): number {
  const min = -60;
  const max = 0;
  const normalized = (dB - min) / (max - min);
  return Math.max(0, Math.min(1, normalized));
}

export default useVoiceRecorder;
