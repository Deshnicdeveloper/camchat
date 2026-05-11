/**
 * useVoicePlayback Hook
 * Handles voice note playback with expo-av
 * Ensures only one voice note plays at a time
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

type PlaybackSpeed = 1 | 1.5 | 2;

interface VoicePlaybackState {
  isPlaying: boolean;
  isLoading: boolean;
  currentPosition: number; // in seconds
  duration: number; // in seconds
  playbackSpeed: PlaybackSpeed;
  error: string | null;
}

interface UseVoicePlaybackReturn extends VoicePlaybackState {
  play: (uri: string, messageId: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  toggleSpeed: () => void;
  activeMessageId: string | null;
}

// Global reference to ensure only one sound plays at a time
let globalSoundRef: Audio.Sound | null = null;
let globalMessageIdRef: string | null = null;
let globalStopCallback: (() => void) | null = null;

export function useVoicePlayback(): UseVoicePlaybackReturn {
  const [state, setState] = useState<VoicePlaybackState>({
    isPlaying: false,
    isLoading: false,
    currentPosition: 0,
    duration: 0,
    playbackSpeed: 1,
    error: null,
  });

  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(async () => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }

    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        // Ignore cleanup errors
      }
      soundRef.current = null;
    }

    // Clear global refs if this instance owns them
    if (globalSoundRef === soundRef.current) {
      globalSoundRef = null;
      globalMessageIdRef = null;
      globalStopCallback = null;
    }
  }, []);

  /**
   * Stop any currently playing sound globally
   */
  const stopGlobalPlayback = useCallback(async () => {
    if (globalSoundRef && globalStopCallback) {
      globalStopCallback();
    }
  }, []);

  /**
   * Handle playback status updates
   */
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('Playback error:', status.error);
        setState((prev) => ({ ...prev, error: status.error || null, isPlaying: false }));
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      isPlaying: status.isPlaying,
      currentPosition: Math.floor((status.positionMillis || 0) / 1000),
      duration: Math.floor((status.durationMillis || 0) / 1000),
    }));

    // Handle playback finished
    if (status.didJustFinish) {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentPosition: 0,
      }));
      setActiveMessageId(null);
    }
  }, []);

  /**
   * Play a voice note
   */
  const play = useCallback(
    async (uri: string, messageId: string) => {
      try {
        // Stop any currently playing sound
        await stopGlobalPlayback();

        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        // Create and load sound
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, rate: state.playbackSpeed },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        globalSoundRef = sound;
        globalMessageIdRef = messageId;
        globalStopCallback = () => {
          stop();
        };

        setActiveMessageId(messageId);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPlaying: true,
        }));

        console.log('▶️ Playing voice note:', messageId);
      } catch (error) {
        console.error('Error playing voice note:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to play voice note',
        }));
      }
    },
    [state.playbackSpeed, onPlaybackStatusUpdate, stopGlobalPlayback]
  );

  /**
   * Pause playback
   */
  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setState((prev) => ({ ...prev, isPlaying: false }));
        console.log('⏸️ Paused voice note');
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setState((prev) => ({ ...prev, isPlaying: true }));
        console.log('▶️ Resumed voice note');
      }
    } catch (error) {
      console.error('Error resuming:', error);
    }
  }, []);

  /**
   * Stop playback
   */
  const stop = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentPosition: 0,
      }));
      setActiveMessageId(null);

      // Clear global refs
      globalSoundRef = null;
      globalMessageIdRef = null;
      globalStopCallback = null;

      console.log('⏹️ Stopped voice note');
    } catch (error) {
      console.error('Error stopping:', error);
    }
  }, []);

  /**
   * Seek to position
   */
  const seek = useCallback(async (position: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(position * 1000);
        setState((prev) => ({ ...prev, currentPosition: position }));
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }, []);

  /**
   * Toggle playback speed: 1x → 1.5x → 2x → 1x
   */
  const toggleSpeed = useCallback(async () => {
    const speedOrder: PlaybackSpeed[] = [1, 1.5, 2];
    const currentIndex = speedOrder.indexOf(state.playbackSpeed);
    const nextSpeed = speedOrder[(currentIndex + 1) % speedOrder.length];

    setState((prev) => ({ ...prev, playbackSpeed: nextSpeed }));

    // Apply to current sound if playing
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(nextSpeed, true);
      } catch (error) {
        console.error('Error setting playback speed:', error);
      }
    }

    console.log('🔄 Playback speed:', nextSpeed);
  }, [state.playbackSpeed]);

  return {
    ...state,
    activeMessageId,
    play,
    pause,
    resume,
    stop,
    seek,
    toggleSpeed,
  };
}

export default useVoicePlayback;
