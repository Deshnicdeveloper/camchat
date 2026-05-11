/**
 * Chats Screen
 * Displays list of all conversations
 */

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { t } from '../../../lib/i18n';
import { ChatRow } from '../../../components/chat';
import { SkeletonChatRow } from '../../../components/ui/Skeleton';
import { Chat } from '../../../types';

// Mock data for UI development - will be replaced with real data from Firestore
const MOCK_CHATS: Chat[] = [
  {
    id: '1',
    type: 'direct',
    participants: ['user1', 'user2'],
    createdBy: 'user1',
    createdAt: new Date(),
    lastMessage: {
      text: 'Hey! How are you doing today?',
      senderId: 'user2',
      type: 'text',
      timestamp: new Date(),
    },
    unreadCount: { user1: 2, user2: 0 },
  },
  {
    id: '2',
    type: 'direct',
    participants: ['user1', 'user3'],
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 3600000),
    lastMessage: {
      text: '',
      senderId: 'user3',
      type: 'image',
      timestamp: new Date(Date.now() - 3600000),
    },
    unreadCount: { user1: 0, user3: 0 },
  },
  {
    id: '3',
    type: 'group',
    participants: ['user1', 'user2', 'user3', 'user4'],
    createdBy: 'user1',
    createdAt: new Date(Date.now() - 86400000),
    lastMessage: {
      text: '',
      senderId: 'user4',
      type: 'audio',
      timestamp: new Date(Date.now() - 86400000),
    },
    unreadCount: { user1: 5, user2: 0, user3: 0, user4: 0 },
    groupName: 'CamChat Fam 🇨🇲',
  },
];

// Mock participant data
const MOCK_PARTICIPANTS: Record<string, { name: string; avatar?: string; isOnline: boolean }> = {
  user2: { name: 'Marie Ngono', isOnline: true },
  user3: { name: 'Jean-Pierre Kamga', isOnline: false },
  user4: { name: 'Aminatou Bello', isOnline: true },
};

const CURRENT_USER_ID = 'user1';

export default function ChatsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // TODO: Refresh chats from Firestore
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleChatPress = useCallback((chatId: string) => {
    router.push(`/(tabs)/chats/${chatId}`);
  }, []);

  const handleNewChat = useCallback(() => {
    router.push('/new-chat');
  }, []);

  const handleSearch = useCallback(() => {
    // TODO: Implement search
  }, []);

  const handleArchive = useCallback((chatId: string) => {
    // TODO: Archive chat
    console.log('Archive chat:', chatId);
  }, []);

  const handleMute = useCallback((chatId: string) => {
    // TODO: Mute chat
    console.log('Mute chat:', chatId);
  }, []);

  const handleDelete = useCallback((chatId: string) => {
    // TODO: Delete chat
    setChats((prev) => prev.filter((c) => c.id !== chatId));
  }, []);

  const getParticipantInfo = (chat: Chat) => {
    if (chat.type === 'group') {
      return {
        name: chat.groupName || 'Group',
        avatar: chat.groupAvatarUrl,
        isOnline: false,
      };
    }
    const participantId = chat.participants.find((p) => p !== CURRENT_USER_ID) || '';
    return MOCK_PARTICIPANTS[participantId] || { name: 'Unknown', isOnline: false };
  };

  const renderChatItem = useCallback(
    ({ item }: { item: Chat }) => {
      const participant = getParticipantInfo(item);
      return (
        <ChatRow
          chat={item}
          participantName={participant.name}
          participantAvatar={participant.avatar}
          isOnline={participant.isOnline}
          currentUserId={CURRENT_USER_ID}
          onPress={() => handleChatPress(item.id)}
          onArchive={() => handleArchive(item.id)}
          onMute={() => handleMute(item.id)}
          onDelete={() => handleDelete(item.id)}
        />
      );
    },
    [handleChatPress, handleArchive, handleMute, handleDelete]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color={Colors.primary} />
      <Text style={styles.emptyText}>{t('chats.noChats')}</Text>
      <Pressable style={styles.startChatButton} onPress={handleNewChat}>
        <Ionicons name="create-outline" size={20} color={Colors.textInverse} />
        <Text style={styles.startChatText}>{t('chats.newChat')}</Text>
      </Pressable>
    </View>
  );

  const renderLoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonChatRow key={i} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('chats.title')}</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleSearch} style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color={Colors.textInverse} />
          </Pressable>
          <Pressable onPress={handleNewChat} style={styles.headerButton}>
            <Ionicons name="create-outline" size={24} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Chat List */}
      <View style={styles.content}>
        {isLoading ? (
          renderLoadingSkeleton()
        ) : chats.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.lg + 64 + Spacing.md, // Avatar width + margins
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
  },
  startChatText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    marginLeft: Spacing.sm,
  },
  skeletonContainer: {
    flex: 1,
  },
});
