/**
 * MessageActionsSheet Component
 * Bottom sheet with message actions: Reply, React, Star, Copy, Delete
 */

import { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';
import type { Message } from '../../types';

// Emoji reactions
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface MessageActionsSheetProps {
  visible: boolean;
  message: Message | null;
  onClose: () => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onStar: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const MessageActionsSheet = memo(function MessageActionsSheet({
  visible,
  message,
  onClose,
  onReply,
  onReact,
  onStar,
  onCopy,
  onDelete,
}: MessageActionsSheetProps) {
  const handleBackdropPress = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!message) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Emoji Reactions Bar */}
          <View style={styles.reactionsBar}>
            {REACTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.reactionButton}
                onPress={() => onReact(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Action Buttons */}
          <ScrollView style={styles.actions} showsVerticalScrollIndicator={false}>
            {/* Reply */}
            <Pressable style={styles.actionRow} onPress={onReply}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary }]}>
                <Ionicons name="arrow-undo" size={20} color={Colors.textInverse} />
              </View>
              <Text style={styles.actionText}>{t('messages.reply')}</Text>
            </Pressable>

            {/* Star */}
            <Pressable style={styles.actionRow} onPress={onStar}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.warning }]}>
                <Ionicons
                  name={message.isStarred ? 'star' : 'star-outline'}
                  size={20}
                  color={Colors.textInverse}
                />
              </View>
              <Text style={styles.actionText}>
                {message.isStarred ? t('messages.unstar') : t('messages.star')}
              </Text>
            </Pressable>

            {/* Copy (only for text messages) */}
            {message.type === 'text' && message.text && (
              <Pressable style={styles.actionRow} onPress={onCopy}>
                <View style={[styles.actionIcon, { backgroundColor: Colors.info }]}>
                  <Ionicons name="copy" size={20} color={Colors.textInverse} />
                </View>
                <Text style={styles.actionText}>{t('messages.copy')}</Text>
              </Pressable>
            )}

            {/* Delete */}
            <Pressable style={styles.actionRow} onPress={onDelete}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.error }]}>
                <Ionicons name="trash" size={20} color={Colors.textInverse} />
              </View>
              <Text style={[styles.actionText, styles.deleteText]}>
                {t('common.delete')}
              </Text>
            </Pressable>
          </ScrollView>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '60%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  deleteText: {
    color: Colors.error,
  },
  cancelButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
});

export default MessageActionsSheet;
