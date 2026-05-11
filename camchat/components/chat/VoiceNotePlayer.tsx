/**
 * VoiceNotePlayer Component
 * Audio playback with waveform visualization and speed control
 */

import { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants';

interface VoiceNotePlayerProps {
  duration: number; // Total duration in seconds
  currentPosition: number; // Current position in seconds
  isPlaying: boolean;
  isLoading: boolean;
  playbackSpeed: 1 | 1.5 | 2;
  isSent: boolean; // For styling (sent vs received)
  waveformData?: number[]; // Normalized 0-1 values
  onPlay: () => void;
  onPause: () => void;
  onSpeedToggle: () => void;
}

// Generate placeholder waveform if none provided
const generateWaveform = (count: number): number[] => {
  return Array.from({ length: count }, () => 0.2 + Math.random() * 0.6);
};

export const VoiceNotePlayer = memo(function VoiceNotePlayer({
  duration,
  currentPosition,
  isPlaying,
  isLoading,
  playbackSpeed,
  isSent,
  waveformData,
  onPlay,
  onPause,
  onSpeedToggle,
}: VoiceNotePlayerProps) {
  // Use provided waveform or generate placeholder
  const waveform = useMemo(() => {
    return waveformData || generateWaveform(30);
  }, [waveformData]);

  // Calculate playback progress
  const progress = duration > 0 ? currentPosition / duration : 0;
  const playedBars = Math.floor(progress * waveform.length);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Display remaining time when playing, total time when idle
  const displayTime = isPlaying ? duration - currentPosition : duration;

  // Color scheme based on sent/received
  const colors = {
    playButton: isSent ? Colors.textInverse : Colors.primary,
    playButtonBg: isSent ? 'transparent' : 'transparent',
    waveformPlayed: isSent ? Colors.textInverse : Colors.primary,
    waveformUnplayed: isSent ? 'rgba(255,255,255,0.4)' : Colors.divider,
    text: isSent ? Colors.textInverse : Colors.textSecondary,
    speedBadge: isSent ? 'rgba(255,255,255,0.2)' : Colors.surface,
    speedText: isSent ? Colors.textInverse : Colors.textPrimary,
  };

  return (
    <View style={styles.container}>
      {/* Play/Pause Button */}
      <Pressable
        style={[styles.playButton, { backgroundColor: colors.playButtonBg }]}
        onPress={isPlaying ? onPause : onPlay}
        disabled={isLoading}
      >
        {isLoading ? (
          <View style={styles.loadingDot} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color={colors.playButton}
          />
        )}
      </Pressable>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        {waveform.map((level, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: Math.max(4, level * 20),
                backgroundColor:
                  index < playedBars ? colors.waveformPlayed : colors.waveformUnplayed,
              },
            ]}
          />
        ))}
      </View>

      {/* Duration and Speed */}
      <View style={styles.infoContainer}>
        <Text style={[styles.durationText, { color: colors.text }]}>
          {formatTime(displayTime)}
        </Text>

        {/* Speed badge (only show if not 1x or when playing) */}
        {(playbackSpeed !== 1 || isPlaying) && (
          <Pressable
            style={[styles.speedBadge, { backgroundColor: colors.speedBadge }]}
            onPress={onSpeedToggle}
          >
            <Text style={[styles.speedText, { color: colors.speedText }]}>
              {playbackSpeed}x
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textSecondary,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    marginRight: Spacing.sm,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  infoContainer: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  durationText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
  },
  speedBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: 2,
  },
  speedText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 10,
  },
});

export default VoiceNotePlayer;
