/**
 * VoiceRecordingBar Component
 * Recording UI with waveform, timer, and swipe gestures
 */

import { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';

interface VoiceRecordingBarProps {
  duration: number;
  metering: number[];
  isLocked: boolean;
  onCancel: () => void;
  onStop: () => void;
  onLock: () => void;
  onSlideCancel: () => void;
}

const SLIDE_TO_CANCEL_THRESHOLD = -80;
const SLIDE_TO_LOCK_THRESHOLD = -60;

export const VoiceRecordingBar = memo(function VoiceRecordingBar({
  duration,
  metering,
  isLocked,
  onCancel,
  onStop,
  onLock,
  onSlideCancel,
}: VoiceRecordingBarProps) {
  const slideX = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing red dot animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLocked,
      onMoveShouldSetPanResponder: () => !isLocked,
      onPanResponderMove: (_, gestureState) => {
        // Horizontal slide (cancel)
        if (gestureState.dx < 0) {
          slideX.setValue(Math.max(gestureState.dx, SLIDE_TO_CANCEL_THRESHOLD - 20));
        }
        // Vertical slide (lock)
        if (gestureState.dy < 0) {
          slideY.setValue(Math.max(gestureState.dy, SLIDE_TO_LOCK_THRESHOLD - 20));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Check if slid far enough to cancel
        if (gestureState.dx < SLIDE_TO_CANCEL_THRESHOLD) {
          onSlideCancel();
          return;
        }
        // Check if slid up to lock
        if (gestureState.dy < SLIDE_TO_LOCK_THRESHOLD) {
          onLock();
        }
        // Reset position
        Animated.parallel([
          Animated.spring(slideX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(slideY, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render waveform bars
  const renderWaveform = () => {
    const bars = metering.length > 0 ? metering : Array(20).fill(0.2);
    return (
      <View style={styles.waveformContainer}>
        {bars.slice(-30).map((level, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              { height: Math.max(4, level * 24) },
            ]}
          />
        ))}
      </View>
    );
  };

  if (isLocked) {
    // Locked mode - show send button
    return (
      <View style={styles.lockedContainer}>
        <View style={styles.lockedLeft}>
          {/* Recording indicator */}
          <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
          <Text style={styles.durationText}>{formatDuration(duration)}</Text>

          {/* Waveform */}
          {renderWaveform()}
        </View>

        <View style={styles.lockedActions}>
          {/* Cancel button */}
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Ionicons name="trash" size={22} color={Colors.error} />
          </Pressable>

          {/* Send button */}
          <Pressable style={styles.sendButton} onPress={onStop}>
            <Ionicons name="send" size={22} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>
    );
  }

  // Recording mode with swipe gestures
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: slideX },
            { translateY: slideY },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Left side - slide to cancel hint */}
      <Animated.View
        style={[
          styles.cancelHint,
          {
            opacity: slideX.interpolate({
              inputRange: [SLIDE_TO_CANCEL_THRESHOLD, 0],
              outputRange: [1, 0.6],
            }),
          },
        ]}
      >
        <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
        <Text style={styles.cancelHintText}>{t('voiceNotes.slideToCancel')}</Text>
      </Animated.View>

      {/* Center - recording info */}
      <View style={styles.recordingInfo}>
        {/* Red pulsing dot */}
        <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />

        {/* Duration */}
        <Text style={styles.durationText}>{formatDuration(duration)}</Text>

        {/* Waveform */}
        {renderWaveform()}
      </View>

      {/* Right side - lock hint */}
      <Animated.View
        style={[
          styles.lockHint,
          {
            opacity: slideY.interpolate({
              inputRange: [SLIDE_TO_LOCK_THRESHOLD, 0],
              outputRange: [1, 0.4],
            }),
          },
        ]}
      >
        <Ionicons name="lock-closed" size={18} color={Colors.textSecondary} />
      </Animated.View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  lockedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelHintText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    marginRight: Spacing.sm,
  },
  durationText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginRight: Spacing.md,
    minWidth: 40,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    maxWidth: 150,
  },
  waveformBar: {
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  lockHint: {
    padding: Spacing.xs,
  },
  cancelButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VoiceRecordingBar;
