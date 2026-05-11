/**
 * VoiceNotePlayer Component
 * Audio playback with waveform visualization, speed control, and download support
 * Similar to WhatsApp - downloads first, then plays instantly
 */

import { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
  // Download state
  isDownloaded?: boolean;
  isDownloading?: boolean;
  downloadProgress?: number; // 0-100
  onDownload?: () => void;
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
  isDownloaded = true, // Default to true for backward compatibility
  isDownloading = false,
  downloadProgress = 0,
  onDownload,
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
    playButtonBg: isSent ? 'rgba(255,255,255,0.15)' : 'rgba(16,52,166,0.1)',
    waveformPlayed: isSent ? Colors.textInverse : Colors.primary,
    waveformUnplayed: isSent ? 'rgba(255,255,255,0.4)' : Colors.divider,
    text: isSent ? 'rgba(255,255,255,0.85)' : Colors.textSecondary,
    speedBadge: isSent ? 'rgba(255,255,255,0.2)' : Colors.surface,
    speedText: isSent ? Colors.textInverse : Colors.textPrimary,
    downloadIcon: isSent ? Colors.textInverse : Colors.primary,
  };

  // Handle button press
  const handleButtonPress = () => {
    if (!isDownloaded && !isDownloading) {
      // Need to download first
      onDownload?.();
    } else if (isDownloaded && !isDownloading) {
      // Can play/pause
      if (isPlaying) {
        onPause();
      } else {
        onPlay();
      }
    }
    // If downloading, do nothing
  };

  // Render the main action button
  const renderActionButton = () => {
    if (isDownloading) {
      // Show download progress
      return (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color={colors.downloadIcon} />
          <Text style={[styles.progressText, { color: colors.text }]}>
            {downloadProgress}%
          </Text>
        </View>
      );
    }

    if (!isDownloaded) {
      // Show download button
      return (
        <Ionicons
          name="download-outline"
          size={22}
          color={colors.downloadIcon}
        />
      );
    }

    if (isLoading) {
      // Show loading spinner
      return <ActivityIndicator size="small" color={colors.playButton} />;
    }

    // Show play/pause
    return (
      <Ionicons
        name={isPlaying ? 'pause' : 'play'}
        size={22}
        color={colors.playButton}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Play/Pause/Download Button */}
      <Pressable
        style={[styles.playButton, { backgroundColor: colors.playButtonBg }]}
        onPress={handleButtonPress}
        disabled={isDownloading || isLoading}
      >
        {renderActionButton()}
      </Pressable>

      {/* Waveform */}
      <View style={styles.waveformContainer}>
        {waveform.map((level, index) => {
          // During download, show progress through waveform
          const downloadedBars = isDownloading
            ? Math.floor((downloadProgress / 100) * waveform.length)
            : waveform.length;

          const barColor = !isDownloaded && !isDownloading
            ? colors.waveformUnplayed // All gray if not downloaded
            : isDownloading && index < downloadedBars
              ? colors.waveformPlayed // Downloaded portion
              : index < playedBars
                ? colors.waveformPlayed // Played portion
                : colors.waveformUnplayed;

          return (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, level * 20),
                  backgroundColor: barColor,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Duration and Speed */}
      <View style={styles.infoContainer}>
        <Text style={[styles.durationText, { color: colors.text }]}>
          {formatTime(displayTime)}
        </Text>

        {/* Speed badge (only show when downloaded and playing or non-1x) */}
        {isDownloaded && (playbackSpeed !== 1 || isPlaying) && (
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 8,
    marginTop: 2,
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
