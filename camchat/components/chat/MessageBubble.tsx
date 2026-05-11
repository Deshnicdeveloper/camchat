/**
 * MessageBubble Component
 * Individual message in chat conversation
 */

import { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { formatMessageTime } from '../../utils/formatTime';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { Message, MessageStatus } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  isGroupChat?: boolean;
  senderName?: string;
  senderAvatar?: string;
  onLongPress?: () => void;
  onImagePress?: () => void;
  // Voice note playback props
  isPlayingVoiceNote?: boolean;
  voiceNotePosition?: number;
  voiceNotePlaybackSpeed?: 1 | 1.5 | 2;
  onVoiceNotePlay?: () => void;
  onVoiceNotePause?: () => void;
  onVoiceNoteSpeedToggle?: () => void;
}

/**
 * Render message status ticks
 */
function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'sending':
      return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />;
    case 'sent':
      return <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />;
    case 'delivered':
      return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />;
    case 'read':
      return <Ionicons name="checkmark-done" size={14} color={Colors.primaryLight} />;
    default:
      return null;
  }
}

function MessageBubble({
  message,
  isSent,
  isGroupChat = false,
  senderName,
  senderAvatar,
  onLongPress,
  onImagePress,
  isPlayingVoiceNote = false,
  voiceNotePosition = 0,
  voiceNotePlaybackSpeed = 1,
  onVoiceNotePlay,
  onVoiceNotePause,
  onVoiceNoteSpeedToggle,
}: MessageBubbleProps) {
  const bubbleStyle = isSent ? styles.bubbleSent : styles.bubbleReceived;
  const textStyle = isSent ? styles.textSent : styles.textReceived;
  const timeStyle = isSent ? styles.timeSent : styles.timeReceived;

  const handleVoiceNotePlay = useCallback(() => {
    if (isPlayingVoiceNote) {
      onVoiceNotePause?.();
    } else {
      onVoiceNotePlay?.();
    }
  }, [isPlayingVoiceNote, onVoiceNotePlay, onVoiceNotePause]);

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <Pressable onPress={onImagePress}>
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.imageMessage}
              contentFit="cover"
              transition={200}
            />
            {message.text && <Text style={textStyle}>{message.text}</Text>}
          </Pressable>
        );

      case 'audio':
        return (
          <VoiceNotePlayer
            duration={message.audioDuration || 0}
            currentPosition={voiceNotePosition}
            isPlaying={isPlayingVoiceNote}
            isLoading={false}
            playbackSpeed={voiceNotePlaybackSpeed}
            isSent={isSent}
            onPlay={handleVoiceNotePlay}
            onPause={handleVoiceNotePlay}
            onSpeedToggle={onVoiceNoteSpeedToggle || (() => {})}
          />
        );

      case 'video':
        return (
          <Pressable onPress={onImagePress}>
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.mediaThumbnail || message.mediaUrl }}
                style={styles.imageMessage}
                contentFit="cover"
              />
              <View style={styles.videoPlayOverlay}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
            {message.text && <Text style={textStyle}>{message.text}</Text>}
          </Pressable>
        );

      case 'document':
        return (
          <View style={styles.documentContainer}>
            <Ionicons
              name="document-outline"
              size={32}
              color={isSent ? Colors.textInverse : Colors.primary}
            />
            <View style={styles.documentInfo}>
              <Text style={[styles.documentName, textStyle]} numberOfLines={1}>
                {message.fileName || 'Document'}
              </Text>
              {message.fileSize && (
                <Text style={[styles.documentSize, timeStyle]}>
                  {(message.fileSize / 1024).toFixed(1)} KB
                </Text>
              )}
            </View>
          </View>
        );

      case 'location':
        return (
          <View style={styles.locationContainer}>
            <View style={styles.locationMap}>
              <Ionicons name="location" size={32} color={Colors.error} />
            </View>
            <Text style={textStyle}>{message.location?.label || 'Shared location'}</Text>
          </View>
        );

      case 'text':
      default:
        return <Text style={textStyle}>{message.text}</Text>;
    }
  };

  return (
    <View style={[styles.container, isSent ? styles.containerSent : styles.containerReceived]}>
      <Pressable
        style={[styles.bubble, bubbleStyle]}
        onLongPress={onLongPress}
        delayLongPress={200}
      >
        {/* Sender name for group chats */}
        {isGroupChat && !isSent && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <View style={[styles.replyPreview, isSent ? styles.replyPreviewSent : styles.replyPreviewReceived]}>
            <Text style={styles.replyName} numberOfLines={1}>
              {message.replyTo.senderId}
            </Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {message.replyTo.text || `[${message.replyTo.type}]`}
            </Text>
          </View>
        )}

        {/* Message content */}
        {renderContent()}

        {/* Time and status */}
        <View style={styles.metaRow}>
          {message.isStarred && (
            <Ionicons
              name="star"
              size={12}
              color={isSent ? 'rgba(255,255,255,0.7)' : Colors.warning}
              style={styles.starIcon}
            />
          )}
          <Text style={timeStyle}>{formatMessageTime(message.timestamp)}</Text>
          {isSent && (
            <View style={styles.statusIcon}>
              <MessageStatusIcon status={message.status} />
            </View>
          )}
        </View>

        {/* Reactions */}
        {Object.keys(message.reactions).length > 0 && (
          <View style={styles.reactionsContainer}>
            {Object.values(message.reactions).slice(0, 3).map((emoji, index) => (
              <Text key={index} style={styles.reactionEmoji}>
                {emoji}
              </Text>
            ))}
            {Object.keys(message.reactions).length > 3 && (
              <Text style={styles.reactionCount}>
                +{Object.keys(message.reactions).length - 3}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  containerSent: {
    alignItems: 'flex-end',
  },
  containerReceived: {
    alignItems: 'flex-start',
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
  bubbleReceived: {
    backgroundColor: Colors.bubble_received,
    borderBottomLeftRadius: Radius.sm,
  },
  senderName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  textSent: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.bubble_sent_text,
  },
  textReceived: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.bubble_received_text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  starIcon: {
    marginRight: Spacing.xs,
  },
  timeSent: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  timeReceived: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  statusIcon: {
    marginLeft: Spacing.xs,
  },

  // Reply preview
  replyPreview: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderLeftWidth: 3,
    marginBottom: Spacing.sm,
    borderRadius: Radius.sm,
  },
  replyPreviewSent: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: 'rgba(255,255,255,0.5)',
  },
  replyPreviewReceived: {
    backgroundColor: 'rgba(16,52,166,0.1)',
    borderLeftColor: Colors.primary,
  },
  replyName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xs,
    color: Colors.primary,
  },
  replyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Image messages
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },

  // Video messages
  videoContainer: {
    position: 'relative',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Document messages
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  documentName: {
    fontFamily: Typography.fontFamily.medium,
  },
  documentSize: {
    marginTop: 2,
  },

  // Location messages
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

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  reactionEmoji: {
    fontSize: 14,
    marginHorizontal: 1,
  },
  reactionCount: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
});

export default memo(MessageBubble);
