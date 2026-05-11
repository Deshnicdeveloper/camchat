/**
 * PendingMessageBubble Component
 * Shows uploading/pending messages with progress indicator
 * Similar to WhatsApp's optimistic UI
 */

import { memo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { formatMessageTime } from '../../utils/formatTime';
import type { PendingMessage } from '../../hooks/usePendingMessages';
import Svg, { Circle } from 'react-native-svg';

interface PendingMessageBubbleProps {
  message: PendingMessage;
  onRetry?: () => void;
  onCancel?: () => void;
}

/**
 * Circular progress indicator
 */
function CircularProgress({ progress, size = 40 }: { progress: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.progressSvg}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.textInverse}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      {/* Cancel button in center */}
      <View style={styles.progressCenter}>
        <Ionicons name="close" size={16} color={Colors.textInverse} />
      </View>
    </View>
  );
}

function PendingMessageBubble({
  message,
  onRetry,
  onCancel,
}: PendingMessageBubbleProps) {
  const isFailed = message.status === 'failed';

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <View style={styles.mediaContainer}>
            {message.localUri && (
              <Image
                source={{ uri: message.localUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            )}
            {/* Overlay with progress or error */}
            <View style={styles.mediaOverlay}>
              {isFailed ? (
                <Pressable onPress={onRetry} style={styles.errorButton}>
                  <Ionicons name="alert-circle" size={32} color={Colors.error} />
                </Pressable>
              ) : (
                <Pressable onPress={onCancel}>
                  <CircularProgress progress={message.progress} />
                </Pressable>
              )}
            </View>
          </View>
        );

      case 'video':
        return (
          <View style={styles.mediaContainer}>
            {message.localUri && (
              <Image
                source={{ uri: message.localUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
            )}
            {/* Video icon overlay */}
            <View style={[styles.mediaOverlay, styles.videoIconOverlay]}>
              <Ionicons name="videocam" size={20} color={Colors.textInverse} style={styles.videoIcon} />
            </View>
            {/* Progress overlay */}
            <View style={styles.mediaOverlay}>
              {isFailed ? (
                <Pressable onPress={onRetry} style={styles.errorButton}>
                  <Ionicons name="alert-circle" size={32} color={Colors.error} />
                </Pressable>
              ) : (
                <Pressable onPress={onCancel}>
                  <CircularProgress progress={message.progress} />
                </Pressable>
              )}
            </View>
          </View>
        );

      case 'document':
        return (
          <View style={styles.documentContainer}>
            <View style={styles.documentIcon}>
              {isFailed ? (
                <Ionicons name="alert-circle" size={28} color={Colors.error} />
              ) : message.progress < 100 ? (
                <ActivityIndicator size="small" color={Colors.textInverse} />
              ) : (
                <Ionicons name="document" size={28} color={Colors.textInverse} />
              )}
            </View>
            <View style={styles.documentInfo}>
              <Text style={styles.documentName} numberOfLines={1}>
                {message.fileName || 'Document'}
              </Text>
              {message.fileSize && (
                <Text style={styles.documentSize}>
                  {formatFileSize(message.fileSize)}
                  {!isFailed && message.progress < 100 && ` • ${message.progress}%`}
                </Text>
              )}
            </View>
            {isFailed && (
              <Pressable onPress={onRetry} style={styles.retryButton}>
                <Ionicons name="refresh" size={20} color={Colors.textInverse} />
              </Pressable>
            )}
          </View>
        );

      case 'location':
        return (
          <View style={styles.locationContainer}>
            <View style={styles.locationMap}>
              {isFailed ? (
                <Ionicons name="alert-circle" size={32} color={Colors.error} />
              ) : (
                <>
                  <Ionicons name="location" size={32} color={Colors.error} />
                  {message.progress < 100 && (
                    <ActivityIndicator size="small" color={Colors.primary} style={styles.locationLoader} />
                  )}
                </>
              )}
            </View>
            <Text style={styles.locationLabel}>
              {message.location?.label || 'Sending location...'}
            </Text>
          </View>
        );

      default:
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.textInverse} />
            <Text style={styles.loadingText}>Sending...</Text>
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, styles.containerSent]}>
      <View style={[styles.bubble, styles.bubbleSent, isFailed && styles.bubbleFailed]}>
        {renderContent()}

        {/* Time and status */}
        <View style={styles.metaRow}>
          <Text style={styles.time}>{formatMessageTime(message.createdAt)}</Text>
          <View style={styles.statusIcon}>
            {isFailed ? (
              <Ionicons name="alert-circle" size={14} color={Colors.error} />
            ) : (
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
            )}
          </View>
        </View>

        {/* Error message */}
        {isFailed && message.error && (
          <Text style={styles.errorText}>{message.error}</Text>
        )}
      </View>
    </View>
  );
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  containerSent: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  bubbleSent: {
    backgroundColor: Colors.bubble_sent,
    borderBottomRightRadius: Radius.sm,
  },
  bubbleFailed: {
    opacity: 0.8,
  },

  // Media
  mediaContainer: {
    position: 'relative',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: Radius.md,
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoIconOverlay: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: Spacing.sm,
  },
  videoIcon: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: Radius.sm,
    padding: 4,
  },

  // Progress
  progressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSvg: {
    position: 'absolute',
  },
  progressCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error
  errorButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 4,
  },
  retryButton: {
    padding: Spacing.xs,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },

  // Document
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  documentIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  documentName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },
  documentSize: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Location
  locationContainer: {
    minWidth: 180,
  },
  locationMap: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  locationLoader: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  locationLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  loadingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    marginLeft: Spacing.sm,
  },

  // Meta
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  time: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  statusIcon: {
    marginLeft: Spacing.xs,
  },
});

export default memo(PendingMessageBubble);
