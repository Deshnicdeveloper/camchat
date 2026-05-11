/**
 * Chat Detail Screen
 * Full 1-on-1 chat room with messages, input, and real-time updates
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '../../../constants';
import { t } from '../../../lib/i18n';
import { formatLastSeen } from '../../../utils/formatters';
import { MessageBubble, MessageInput, DateSeparator } from '../../../components/chat';
import { TypingIndicator } from '../../../components/chat/TypingIndicator';
import { MessageActionsSheet } from '../../../components/chat/MessageActionsSheet';
import { AttachmentPicker } from '../../../components/chat/AttachmentPicker';
import { ImageViewer } from '../../../components/ui/ImageViewer';
import { useMessages } from '../../../hooks/useMessages';
import { useChat } from '../../../hooks/useChat';
import { useAuthStore } from '../../../store/authStore';
import { getChatById } from '../../../lib/chat';
import { getUsersByIds } from '../../../lib/contacts';
import type { Message, Chat, ReplyReference, UserProfile } from '../../../types';

// Helper to check if two dates are on different days
function isDifferentDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() !== date2.getFullYear() ||
    date1.getMonth() !== date2.getMonth() ||
    date1.getDate() !== date2.getDate()
  );
}

// Type for list items (message or date separator)
type ListItem =
  | { type: 'message'; data: Message }
  | { type: 'separator'; date: Date; key: string };

export default function ChatDetailScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { getParticipant } = useChat();

  // Chat state
  const [chat, setChat] = useState<Chat | null>(null);
  const [participant, setParticipant] = useState<UserProfile | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(true);

  // UI state
  const [replyingTo, setReplyingTo] = useState<{
    message: Message;
    name: string;
    text: string;
  } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Load chat data
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) return;

      setIsLoadingChat(true);
      const result = await getChatById(chatId);

      if (result.success && result.chat) {
        setChat(result.chat);

        // Get the other participant
        const otherParticipantId = result.chat.participants.find(
          (p) => p !== user?.uid
        );
        if (otherParticipantId) {
          // First try to get from cache
          let participantData = getParticipant(otherParticipantId);

          // If not in cache, fetch from Firestore
          if (!participantData) {
            console.log('📡 Fetching participant data from Firestore:', otherParticipantId);
            const users = await getUsersByIds([otherParticipantId]);
            if (users.length > 0) {
              const u = users[0];
              participantData = {
                uid: u.uid,
                displayName: u.displayName,
                avatarUrl: u.avatarUrl,
                about: u.about,
                isOnline: u.isOnline,
                lastSeen: u.lastSeen,
              };
            }
          }
          setParticipant(participantData || null);
        }
      }
      setIsLoadingChat(false);
    };

    loadChat();
  }, [chatId, user?.uid, getParticipant]);

  // Messages hook
  const {
    messages,
    isLoading: isLoadingMessages,
    isSending,
    typingUsers,
    sendText,
    sendImage,
    sendVoice,
    sendDocument,
    setTyping,
    reactToMessage,
    toggleStar,
    deleteMessage,
  } = useMessages({
    chatId: chatId || '',
    participants: chat?.participants || [],
  });

  // Build list items with date separators
  const listItems = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    let lastDate: Date | null = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);

      // Add date separator if different day
      if (!lastDate || isDifferentDay(lastDate, messageDate)) {
        items.push({
          type: 'separator',
          date: messageDate,
          key: `separator-${messageDate.toISOString().split('T')[0]}`,
        });
        lastDate = messageDate;
      }

      items.push({ type: 'message', data: message });
    });

    return items;
  }, [messages]);

  // Get participant name
  const participantName = useMemo(() => {
    if (chat?.type === 'group') {
      return chat.groupName || 'Group';
    }
    return participant?.displayName || 'Chat';
  }, [chat, participant]);

  // Get online status text
  const statusText = useMemo(() => {
    if (typingUsers.length > 0) {
      return t('chats.typing');
    }
    if (participant?.isOnline) {
      return t('chats.online');
    }
    if (participant?.lastSeen) {
      return formatLastSeen(participant.lastSeen);
    }
    return '';
  }, [typingUsers, participant]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const replyRef: ReplyReference | undefined = replyingTo
        ? {
            messageId: replyingTo.message.id,
            senderId: replyingTo.message.senderId,
            text: replyingTo.text,
            type: replyingTo.message.type,
          }
        : undefined;

      setReplyingTo(null);
      await sendText(text, replyRef);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendText, replyingTo]
  );

  // Handle message long press
  const handleMessageLongPress = useCallback((message: Message) => {
    setSelectedMessage(message);
    setShowActionsSheet(true);
  }, []);

  // Handle image press
  const handleImagePress = useCallback((imageUrl: string) => {
    setImageViewerUrl(imageUrl);
  }, []);

  // Handle reply action
  const handleReply = useCallback(() => {
    if (selectedMessage) {
      const senderName =
        selectedMessage.senderId === user?.uid
          ? 'You'
          : participant?.displayName || 'User';

      setReplyingTo({
        message: selectedMessage,
        name: senderName,
        text: selectedMessage.text || selectedMessage.type,
      });
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage, user?.uid, participant]);

  // Handle reaction
  const handleReaction = useCallback(
    async (emoji: string) => {
      if (selectedMessage) {
        await reactToMessage(selectedMessage.id, emoji);
      }
      setShowActionsSheet(false);
      setSelectedMessage(null);
    },
    [selectedMessage, reactToMessage]
  );

  // Handle star
  const handleStar = useCallback(async () => {
    if (selectedMessage) {
      await toggleStar(selectedMessage.id, !selectedMessage.isStarred);
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage, toggleStar]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (selectedMessage?.text) {
      const Clipboard = await import('expo-clipboard').then((m) => m.default);
      await Clipboard.setStringAsync(selectedMessage.text);
      Alert.alert('', t('messages.copied'));
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (selectedMessage) {
      Alert.alert(
        t('messages.deleteMessage'),
        t('messages.deleteConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteMessage(selectedMessage.id);
            },
          },
        ]
      );
    }
    setShowActionsSheet(false);
    setSelectedMessage(null);
  }, [selectedMessage, deleteMessage]);

  // Handle attachment selection
  const handleAttachment = useCallback(
    async (type: 'camera' | 'gallery' | 'document' | 'location') => {
      setShowAttachmentPicker(false);

      // TODO: Implement attachment handling
      switch (type) {
        case 'camera':
          // Launch camera
          break;
        case 'gallery':
          // Pick from gallery
          break;
        case 'document':
          // Pick document
          break;
        case 'location':
          // Get location
          break;
      }
    },
    []
  );

  // Handle voice call
  const handleVoiceCall = useCallback(() => {
    // TODO: Implement voice call
  }, []);

  // Handle video call
  const handleVideoCall = useCallback(() => {
    // TODO: Implement video call
  }, []);

  // Handle text change for typing indicator
  const handleTextChange = useCallback(
    (text: string) => {
      setTyping(text.length > 0);
    },
    [setTyping]
  );

  // Render list item
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'separator') {
        return <DateSeparator date={item.date} />;
      }

      const message = item.data;
      const isSent = message.senderId === user?.uid;

      return (
        <MessageBubble
          message={message}
          isSent={isSent}
          onLongPress={() => handleMessageLongPress(message)}
          onImagePress={
            message.type === 'image' && message.mediaUrl
              ? () => handleImagePress(message.mediaUrl!)
              : undefined
          }
        />
      );
    },
    [user?.uid, handleMessageLongPress, handleImagePress]
  );

  // Key extractor
  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === 'separator') {
      return item.key;
    }
    return item.data.id;
  }, []);

  if (isLoadingChat) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>

        <Pressable style={styles.headerInfo} onPress={() => {}}>
          <View style={styles.avatarContainer}>
            {participant?.avatarUrl ? (
              <Image
                source={{ uri: participant.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={20} color={Colors.textSecondary} />
              </View>
            )}
            {participant?.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {participantName}
            </Text>
            <Text
              style={[
                styles.headerStatus,
                typingUsers.length > 0 && styles.typingStatus,
              ]}
              numberOfLines={1}
            >
              {statusText}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable onPress={handleVideoCall} style={styles.headerButton}>
            <Ionicons name="videocam" size={22} color={Colors.textInverse} />
          </Pressable>
          <Pressable onPress={handleVoiceCall} style={styles.headerButton}>
            <Ionicons name="call" size={22} color={Colors.textInverse} />
          </Pressable>
          <Pressable onPress={() => {}} style={styles.headerButton}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.messagesContainer}>
          {isLoadingMessages ? (
            <View style={styles.loadingMessages}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>{t('messages.noMessages')}</Text>
              <Text style={styles.emptySubtext}>{t('messages.startConversation')}</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={listItems}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: false })
              }
            />
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View style={styles.typingContainer}>
              <TypingIndicator />
            </View>
          )}
        </View>

        {/* Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onAttachPress={() => setShowAttachmentPicker(true)}
          onTextChange={handleTextChange}
          replyingTo={
            replyingTo
              ? { name: replyingTo.name, text: replyingTo.text }
              : null
          }
          onCancelReply={() => setReplyingTo(null)}
          disabled={isSending}
        />
      </KeyboardAvoidingView>

      {/* Message Actions Bottom Sheet */}
      <MessageActionsSheet
        visible={showActionsSheet}
        message={selectedMessage}
        onClose={() => {
          setShowActionsSheet(false);
          setSelectedMessage(null);
        }}
        onReply={handleReply}
        onReact={handleReaction}
        onStar={handleStar}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />

      {/* Attachment Picker Bottom Sheet */}
      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onSelect={handleAttachment}
      />

      {/* Image Viewer */}
      {imageViewerUrl && (
        <ImageViewer
          imageUrl={imageViewerUrl}
          onClose={() => setImageViewerUrl(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  headerStatus: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  typingStatus: {
    color: Colors.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  typingContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
