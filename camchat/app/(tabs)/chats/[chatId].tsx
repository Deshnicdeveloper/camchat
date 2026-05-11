/**
 * Chat Room Screen
 * Individual chat conversation view (supports both direct and group chats)
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { t } from '../../../lib/i18n';
import { Avatar } from '../../../components/ui';
import { MessageBubble, MessageInput, DateSeparator } from '../../../components/chat';
import { Message, Chat, UserProfile } from '../../../types';
import { formatLastSeen } from '../../../utils/formatTime';
import { useAuthStore } from '../../../store/authStore';
import { useChatStore } from '../../../store/chatStore';
import { getChatById, resetUnreadCount } from '../../../lib/chat';
import { getUsersByIds } from '../../../lib/contacts';
import { subscribeToMessages, sendMessage } from '../../../lib/messages';

interface MessageItem {
  type: 'message' | 'date';
  data: Message | Date;
  id: string;
}

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuthStore();
  const { participants: storeParticipants, setParticipants: setStoreParticipants } = useChatStore();

  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Map<string, UserProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ name: string; text: string; messageId: string; senderId: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load chat data
  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const loadChat = async () => {
      setIsLoading(true);
      try {
        // Get chat details
        const result = await getChatById(chatId);
        if (result.success && result.chat) {
          setChat(result.chat);

          // Reset unread count
          await resetUnreadCount(chatId, user.uid);

          // Load participants
          const participantIds = result.chat.participants.filter((id) => id !== user.uid);
          if (participantIds.length > 0) {
            const users = await getUsersByIds(participantIds);
            const participantMap = new Map<string, UserProfile>();
            const storeMap: Record<string, UserProfile> = { ...storeParticipants };

            users.forEach((u) => {
              const profile: UserProfile = {
                uid: u.uid,
                displayName: u.displayName,
                avatarUrl: u.avatarUrl,
                about: u.about,
                isOnline: u.isOnline,
                lastSeen: u.lastSeen,
              };
              participantMap.set(u.uid, profile);
              storeMap[u.uid] = profile;
            });

            setParticipants(participantMap);
            setStoreParticipants(storeMap);
          }
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChat();

    // Subscribe to messages
    unsubscribeRef.current = subscribeToMessages(chatId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chatId, user?.uid]);

  // Get other participant for direct chat
  const otherParticipant = useMemo(() => {
    if (!chat || chat.type === 'group' || !user?.uid) return null;

    const otherUserId = chat.participants.find((id) => id !== user.uid);
    if (otherUserId) {
      return participants.get(otherUserId);
    }
    return null;
  }, [chat, participants, user?.uid]);

  // Get participant name by ID (for group messages)
  const getParticipantName = useCallback(
    (senderId: string): string => {
      if (senderId === user?.uid) return 'You';
      const participant = participants.get(senderId);
      return participant?.displayName || 'Unknown';
    },
    [participants, user?.uid]
  );

  // Get participant for a sender ID
  const getSenderProfile = useCallback(
    (senderId: string): UserProfile | undefined => {
      return participants.get(senderId);
    },
    [participants]
  );

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
    async (text: string) => {
      if (!chatId || !user?.uid || !chat) return;

      try {
        await sendMessage(chatId, user.uid, {
          type: 'text',
          text,
          replyTo: replyingTo
            ? {
                messageId: replyingTo.messageId,
                senderId: replyingTo.senderId,
                text: replyingTo.text,
                type: 'text',
              }
            : undefined,
        }, chat.participants);

        setReplyingTo(null);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [chatId, user?.uid, chat, replyingTo]
  );

  const handleAttachPress = useCallback(() => {
    // TODO: Show attachment options bottom sheet
    console.log('Attachment pressed');
  }, []);

  const handleMessageLongPress = useCallback((message: Message) => {
    // TODO: Show message options bottom sheet
    console.log('Long press on message:', message.id);

    // For now, allow replying
    const senderName = getParticipantName(message.senderId);
    setReplyingTo({
      name: senderName,
      text: message.text || (message.type === 'image' ? 'Photo' : message.type === 'audio' ? 'Voice message' : 'Message'),
      messageId: message.id,
      senderId: message.senderId,
    });
  }, [getParticipantName]);

  const handleVideoCall = useCallback(() => {
    // TODO: Initiate video call
    console.log('Video call');
  }, []);

  const handleVoiceCall = useCallback(() => {
    // TODO: Initiate voice call
    console.log('Voice call');
  }, []);

  const handleMoreOptions = useCallback(() => {
    if (chat?.type === 'group' && chatId) {
      router.push(`/group/${chatId}`);
    } else {
      // TODO: Show more options for direct chat
      console.log('More options');
    }
  }, [chat, chatId]);

  const handleHeaderPress = useCallback(() => {
    if (chat?.type === 'group' && chatId) {
      router.push(`/group/${chatId}`);
    } else if (otherParticipant) {
      router.push(`/profile/${otherParticipant.uid}`);
    }
  }, [chat, chatId, otherParticipant]);

  const renderItem = useCallback(
    ({ item }: { item: MessageItem }) => {
      if (item.type === 'date') {
        return <DateSeparator date={item.data as Date} />;
      }

      const message = item.data as Message;
      const isSent = message.senderId === user?.uid;

      // For group chats, show sender name and avatar for received messages
      const showSenderInfo = chat?.type === 'group' && !isSent;
      const senderProfile = showSenderInfo ? getSenderProfile(message.senderId) : undefined;

      return (
        <View>
          {showSenderInfo && (
            <Pressable
              style={styles.senderInfoRow}
              onPress={() => router.push(`/profile/${message.senderId}`)}
            >
              <Text style={styles.senderName}>
                {getParticipantName(message.senderId)}
              </Text>
            </Pressable>
          )}
          <MessageBubble
            message={message}
            isSent={isSent}
            onLongPress={() => handleMessageLongPress(message)}
            senderAvatar={showSenderInfo ? senderProfile?.avatarUrl : undefined}
            senderName={showSenderInfo ? senderProfile?.displayName : undefined}
          />
        </View>
      );
    },
    [user?.uid, chat?.type, getParticipantName, getSenderProfile, handleMessageLongPress]
  );

  const getStatusText = () => {
    if (chat?.type === 'group') {
      return `${chat.participants.length} ${t('groups.participants').toLowerCase()}`;
    }

    if (otherParticipant?.isOnline) {
      return t('chats.online');
    }

    if (otherParticipant?.lastSeen) {
      return `${t('chats.lastSeen')} ${formatLastSeen(otherParticipant.lastSeen)}`;
    }

    return '';
  };

  const getHeaderTitle = () => {
    if (chat?.type === 'group') {
      return chat.groupName || 'Group';
    }
    return otherParticipant?.displayName || 'Chat';
  };

  const getHeaderAvatar = () => {
    if (chat?.type === 'group') {
      return chat.groupAvatarUrl || '';
    }
    return otherParticipant?.avatarUrl || '';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Chat not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
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

        <Pressable style={styles.headerProfile} onPress={handleHeaderPress}>
          <Avatar
            uri={getHeaderAvatar()}
            name={getHeaderTitle()}
            size="sm"
            showOnlineStatus={chat.type === 'direct'}
            isOnline={chat.type === 'direct' && otherParticipant?.isOnline}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getHeaderTitle()}
            </Text>
            <Text style={styles.headerSubtitle}>{getStatusText()}</Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          {chat.type === 'direct' && (
            <>
              <Pressable style={styles.headerButton} onPress={handleVideoCall}>
                <Ionicons name="videocam-outline" size={22} color={Colors.textInverse} />
              </Pressable>
              <Pressable style={styles.headerButton} onPress={handleVoiceCall}>
                <Ionicons name="call-outline" size={22} color={Colors.textInverse} />
              </Pressable>
            </>
          )}
          <Pressable style={styles.headerButton} onPress={handleMoreOptions}>
            <Ionicons
              name={chat.type === 'group' ? 'information-circle-outline' : 'ellipsis-vertical'}
              size={22}
              color={Colors.textInverse}
            />
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
          replyingTo={replyingTo ? { name: replyingTo.name, text: replyingTo.text } : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  backLink: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  // Group message sender info
  senderInfoRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  senderName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },
});
