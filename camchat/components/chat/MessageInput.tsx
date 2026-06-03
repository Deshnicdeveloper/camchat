/**
 * MessageInput Component
 * Chat input bar with text input, attachments, and voice recording
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { t } from '../../lib/i18n';
import { VoiceRecordingBar } from './VoiceRecordingBar';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendVoiceNote?: (uri: string, duration: number) => void;
  onAttachPress: () => void;
  onCameraPress?: () => void;
  onTextChange?: (text: string) => void;
  replyingTo?: {
    name: string;
    text: string;
  } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  onSendVoiceNote,
  onAttachPress,
  onCameraPress,
  onTextChange,
  replyingTo,
  onCancelReply,
  disabled = false,
}: MessageInputProps) {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const inputRef = useRef<TextInput>(null);

  const {
    isRecording,
    isLocked,
    duration,
    metering,
    startRecording,
    stopRecording,
    cancelRecording,
    lockRecording,
  } = useVoiceRecorder();

  const hasText = message.trim().length > 0;

  const handleTextChange = useCallback(
    (text: string) => {
      setMessage(text);
      onTextChange?.(text);
    },
    [onTextChange]
  );

  const handleSend = useCallback(() => {
    if (hasText && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setInputHeight(40);
      onTextChange?.('');
    }
  }, [message, hasText, disabled, onSendMessage, onTextChange]);

  const handleContentSizeChange = useCallback(
    (event: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 120);
      setInputHeight(newHeight);
    },
    []
  );

  // Voice recording handlers
  const handleVoiceStart = useCallback(() => {
    if (!hasText && !disabled) {
      startRecording();
    }
  }, [hasText, disabled, startRecording]);

  const handleVoiceStop = useCallback(async () => {
    const result = await stopRecording();
    if (result && onSendVoiceNote) {
      onSendVoiceNote(result.uri, result.duration);
    }
  }, [stopRecording, onSendVoiceNote]);

  const handleVoiceCancel = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  const handleVoiceLock = useCallback(() => {
    lockRecording();
  }, [lockRecording]);

  // Show recording bar when recording
  if (isRecording) {
    return (
      <View style={styles.container}>
        <VoiceRecordingBar
          duration={duration}
          metering={metering}
          isLocked={isLocked}
          onCancel={handleVoiceCancel}
          onStop={handleVoiceStop}
          onLock={handleVoiceLock}
          onSlideCancel={handleVoiceCancel}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Reply Preview */}
      {replyingTo && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <View style={styles.replyBar} />
            <View style={styles.replyTextContainer}>
              <Ionicons name="arrow-undo" size={14} color={colors.primary} />
              <View style={styles.replyInfo}>
                <View style={styles.replyNameRow}>
                  <Ionicons name="return-down-forward" size={12} color={colors.primary} />
                  <Text style={styles.replyName}>{replyingTo.name}</Text>
                </View>
                <Text style={styles.replyText} numberOfLines={1}>
                  {replyingTo.text}
                </Text>
              </View>
            </View>
          </View>
          <Pressable onPress={onCancelReply} style={styles.cancelReply}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        {/* Input Container */}
        <View style={styles.inputContainer}>
          {/* Emoji Button */}
          <Pressable style={styles.iconButton}>
            <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { height: inputHeight }]}
            placeholder={t('chats.typeMessage')}
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={handleTextChange}
            multiline
            maxLength={4096}
            onContentSizeChange={handleContentSizeChange}
            editable={!disabled}
          />

          {/* Attachment Button */}
          <Pressable style={styles.iconButton} onPress={onAttachPress}>
            <Ionicons name="attach" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Camera Button (only when no text) */}
          {!hasText && onCameraPress && (
            <Pressable style={styles.iconButton} onPress={onCameraPress}>
              <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Send/Voice Button */}
        <Pressable
          style={styles.sendButton}
          onPress={hasText ? handleSend : undefined}
          onPressIn={!hasText ? handleVoiceStart : undefined}
          onPressOut={!hasText && !isLocked ? handleVoiceStop : undefined}
          disabled={disabled}
        >
          <Ionicons
            name={hasText ? 'send' : 'mic'}
            size={22}
            color={colors.textInverse}
          />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  // Reply preview
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  replyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  replyTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  replyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: colors.primary,
    marginLeft: Spacing.xs,
  },
  replyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
  },
  cancelReply: {
    padding: Spacing.xs,
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: colors.textPrimary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
