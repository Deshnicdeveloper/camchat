/**
 * Chat Room Screen
 * Individual chat conversation view
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { t } from '../../../lib/i18n';
import { Avatar } from '../../../components/ui';
import { MessageBubble, MessageInput, DateSeparator } from '../../../components/chat';
import { Message } from '../../../types';
import { formatLastSeen } from '../../../utils/formatTime';

// Mock data for UI development
const CURRENT_USER_ID = 'user1';

const MOCK_PARTICIPANT = {
  uid: 'user2',
  displayName: 'Marie Ngono',
  avatarUrl: '',
  isOnline: true,
  lastSeen: new Date(),
};

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    senderId: 'user2',
    type: 'text',
    text: 'Hey! How are you doing? 👋',
    reactions: {},
    status: 'read',
    readBy: ['user1'],
    deletedFor: [],
    isStarred: false,
    timestamp: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: '2',
    senderId: 'user1',
    type: 'text',
    text: "I'm doing great, thanks for asking! Just finished a project at work. How about you?",
    reactions: { user2: '👍' },
    status: 'read',
    readBy: ['user2'],
    deletedFor: [],
    isStarred: false,
    timestamp: new Date(Date.now() - 3600000 * 1.5),
  },
  {
    id: '3',
    senderId: 'user2',
    type: 'text',
    text: "That's awesome! I'm planning a trip to Douala next week. Want to meet up?",
    reactions: {},
    status: 'read',
    readBy: ['user1'],
    deletedFor: [],
    isStarred: true,
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '4',
    senderId: 'user1',
    type: 'text',
    text: 'Yes, that sounds great! Let me know when you arrive.',
    reactions: {},
    status: 'delivered',
    readBy: [],
    deletedFor: [],
    isStarred: false,
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: '5',
    senderId: 'user2',
    type: 'image',
    mediaUrl: 'https://picsum.photos/400/300',
    text: 'Here is my travel itinerary',
    reactions: { user1: '❤️' },
    status: 'read',
    readBy: ['user1'],
    deletedFor: [],
    isStarred: false,
    timestamp: new Date(Date.now() - 900000),
  },
  {
    id: '6',
    senderId: 'user1',
    type: 'audio',
    audioDuration: 15,
    reactions: {},
    status: 'sent',
    readBy: [],
    deletedFor: [],
    isStarred: false,
    timestamp: new Date(Date.now() - 300000),
  },
];

interface MessageItem {
  type: 'message' | 'date';
  data: Message | Date;
  id: string;
}

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [replyingTo, setReplyingTo] = useState<{ name: string; text: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Process messages with date separators
  const processedMessages = useMemo((): MessageItem[] => {
    const items: MessageItem[] = [];
    let lastDate: string | null = null;

    // Sort messages by timestamp (newest first for inverted list)
    const sortedMessages = [...messages].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    sortedMessages.forEach((message) => {
      const messageDate = message.timestamp.toDateString();

      // Add date separator when date changes
      if (messageDate !== lastDate) {
        items.push({
          type: 'date',
          data: message.timestamp,
          id: `date-${messageDate}`,
        });
        lastDate = messageDate;
      }

      items.push({
        type: 'message',
        data: message,
        id: message.id,
      });
    });

    return items;
  }, [messages]);

  const handleSendMessage = useCallback(
    (text: string) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: CURRENT_USER_ID,
        type: 'text',
        text,
        reactions: {},
        status: 'sending',
        readBy: [],
        deletedFor: [],
        isStarred: false,
        timestamp: new Date(),
        replyTo: replyingTo
          ? {
              messageId: 'reply-id',
              senderId: 'user2',
              text: replyingTo.text,
              type: 'text',
            }
          : undefined,
      };

      setMessages((prev) => [...prev, newMessage]);
      setReplyingTo(null);

      // Simulate message status updates
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'sent' } : m))
        );
      }, 500);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'delivered' } : m))
        );
      }, 1500);
    },
    [replyingTo]
  );

  const handleAttachPress = useCallback(() => {
    // TODO: Show attachment options bottom sheet
    console.log('Attachment pressed');
  }, []);

  const handleMessageLongPress = useCallback((message: Message) => {
    // TODO: Show message options bottom sheet
    console.log('Long press on message:', message.id);
  }, []);

  const handleVideoCall = useCallback(() => {
    // TODO: Initiate video call
    console.log('Video call');
  }, []);

  const handleVoiceCall = useCallback(() => {
    // TODO: Initiate voice call
    console.log('Voice call');
  }, []);

  const handleMoreOptions = useCallback(() => {
    // TODO: Show more options
    console.log('More options');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MessageItem }) => {
      if (item.type === 'date') {
        return <DateSeparator date={item.data as Date} />;
      }

      const message = item.data as Message;
      const isSent = message.senderId === CURRENT_USER_ID;

      return (
        <MessageBubble
          message={message}
          isSent={isSent}
          onLongPress={() => handleMessageLongPress(message)}
        />
      );
    },
    [handleMessageLongPress]
  );

  const getStatusText = () => {
    if (MOCK_PARTICIPANT.isOnline) {
      return t('chats.online');
    }
    return `${t('chats.lastSeen')} ${formatLastSeen(MOCK_PARTICIPANT.lastSeen)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>

        <Pressable style={styles.headerProfile}>
          <Avatar
            uri={MOCK_PARTICIPANT.avatarUrl}
            name={MOCK_PARTICIPANT.displayName}
            size="sm"
            showOnlineStatus
            isOnline={MOCK_PARTICIPANT.isOnline}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {MOCK_PARTICIPANT.displayName}
            </Text>
            <Text style={styles.headerSubtitle}>{getStatusText()}</Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={handleVideoCall}>
            <Ionicons name="videocam-outline" size={22} color={Colors.textInverse} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleVoiceCall}>
            <Ionicons name="call-outline" size={22} color={Colors.textInverse} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleMoreOptions}>
            <Ionicons name="ellipsis-vertical" size={22} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Chat Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={processedMessages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onAttachPress={handleAttachPress}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
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
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    opacity: 0.8,
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
  messagesList: {
    paddingVertical: Spacing.sm,
  },
});
