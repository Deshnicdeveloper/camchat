/**
 * ChatRow Component
 * Individual chat item in the chat list
 */

import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Badge } from '../ui';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { formatChatTime } from '../../utils/formatTime';
import { Chat, MessageType } from '../../types';

interface ChatRowProps {
  chat: Chat;
  participantName: string;
  participantAvatar?: string;
  isOnline?: boolean;
  onPress: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
  currentUserId: string;
}

/**
 * Get preview text for last message based on type
 */
function getMessagePreview(type: MessageType, text?: string): string {
  switch (type) {
    case 'image':
      return '📷 Photo';
    case 'video':
      return '📹 Video';
    case 'audio':
      return '🎤 Voice note';
    case 'document':
      return '📄 Document';
    case 'location':
      return '📍 Location';
    case 'text':
    default:
      return text || '';
  }
}

function ChatRow({
  chat,
  participantName,
  participantAvatar,
  isOnline = false,
  onPress,
  onArchive,
  onMute,
  onDelete,
  currentUserId,
}: ChatRowProps) {
  const unreadCount = chat.unreadCount[currentUserId] || 0;
  const hasUnread = unreadCount > 0;
  const lastMessagePreview = chat.lastMessage
    ? getMessagePreview(chat.lastMessage.type, chat.lastMessage.text)
    : '';
  const lastMessageTime = chat.lastMessage
    ? formatChatTime(chat.lastMessage.timestamp)
    : '';

  const renderRightActions = () => {
    if (!onArchive && !onMute && !onDelete) return null;

    return (
      <View style={styles.swipeActions}>
        {onArchive && (
          <Pressable style={[styles.swipeAction, styles.archiveAction]} onPress={onArchive}>
            <Ionicons name="archive-outline" size={22} color={Colors.textInverse} />
            <Text style={styles.swipeActionText}>Archive</Text>
          </Pressable>
        )}
        {onMute && (
          <Pressable style={[styles.swipeAction, styles.muteAction]} onPress={onMute}>
            <Ionicons name="notifications-off-outline" size={22} color={Colors.textInverse} />
            <Text style={styles.swipeActionText}>Mute</Text>
          </Pressable>
        )}
        {onDelete && (
          <Pressable style={[styles.swipeAction, styles.deleteAction]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={22} color={Colors.textInverse} />
            <Text style={styles.swipeActionText}>Delete</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const content = (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Avatar */}
      <Avatar
        uri={participantAvatar}
        name={participantName}
        size="lg"
        showOnlineStatus
        isOnline={isOnline}
      />

      {/* Chat Info */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
            {chat.type === 'group' ? chat.groupName : participantName}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {lastMessageTime}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
            {lastMessagePreview}
          </Text>
          {hasUnread && <Badge count={unreadCount} size="sm" />}
        </View>
      </View>
    </Pressable>
  );

  // If swipe actions are enabled, wrap in Swipeable
  if (onArchive || onMute || onDelete) {
    return (
      <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
        {content}
      </Swipeable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginRight: Spacing.sm,
  },
  nameUnread: {
    fontFamily: Typography.fontFamily.semibold,
  },
  time: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
  },
  timeUnread: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
  },
  preview: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  previewUnread: {
    color: Colors.textPrimary,
  },
  // Swipe actions
  swipeActions: {
    flexDirection: 'row',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    paddingVertical: Spacing.md,
  },
  swipeActionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    marginTop: 4,
  },
  archiveAction: {
    backgroundColor: Colors.warning,
  },
  muteAction: {
    backgroundColor: Colors.textSecondary,
  },
  deleteAction: {
    backgroundColor: Colors.error,
  },
});

export default memo(ChatRow);
