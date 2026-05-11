/**
 * Chats Screen
 * Displays list of all conversations with real-time updates
 */

import { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { t } from '../../../lib/i18n';
import { ChatRow } from '../../../components/chat';
import { SkeletonChatRow } from '../../../components/ui/Skeleton';
import { Chat } from '../../../types';
import { useChat } from '../../../hooks/useChat';
import { useContacts } from '../../../hooks/useContacts';
import { useAuthStore } from '../../../store/authStore';

export default function ChatsScreen() {
  const { user } = useAuthStore();
  const {
    chats,
    isLoading,
    error,
    getChatParticipant,
    openChat,
    archiveChat,
    muteChat,
    deleteChat,
  } = useChat();

  const { sync: syncContacts, isSyncing } = useContacts();

  const currentUserId = user?.uid || '';

  // Sync contacts on first load
  useEffect(() => {
    if (user?.uid) {
      syncContacts();
    }
  }, [user?.uid]);

  const handleRefresh = useCallback(async () => {
    await syncContacts();
  }, [syncContacts]);

  const handleChatPress = useCallback(
    async (chatId: string) => {
      // Reset unread count when opening chat
      await openChat(chatId);
      router.push(`/(tabs)/chats/${chatId}`);
    },
    [openChat]
  );

  const handleNewChat = useCallback(() => {
    router.push('/new-chat');
  }, []);

  const handleSearch = useCallback(() => {
    // TODO: Implement search
  }, []);

  const handleArchive = useCallback(
    async (chatId: string) => {
      await archiveChat(chatId);
    },
    [archiveChat]
  );

  const handleMute = useCallback(
    async (chatId: string) => {
      await muteChat(chatId);
    },
    [muteChat]
  );

  const handleDelete = useCallback(
    async (chatId: string) => {
      await deleteChat(chatId);
    },
    [deleteChat]
  );

  const renderChatItem = useCallback(
    ({ item }: { item: Chat }) => {
      const participant = getChatParticipant(item);

      return (
        <ChatRow
          chat={item}
          participantName={participant?.displayName || 'Unknown'}
          participantAvatar={participant?.avatarUrl}
          isOnline={participant?.isOnline || false}
          currentUserId={currentUserId}
          onPress={() => handleChatPress(item.id)}
          onArchive={() => handleArchive(item.id)}
          onMute={() => handleMute(item.id)}
          onDelete={() => handleDelete(item.id)}
        />
      );
    },
    [currentUserId, getChatParticipant, handleChatPress, handleArchive, handleMute, handleDelete]
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

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="warning-outline" size={48} color={Colors.error} />
      <Text style={styles.errorText}>{error}</Text>
      <Pressable style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryText}>{t('common.retry')}</Text>
      </Pressable>
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
        {isLoading && chats.length === 0 ? (
          renderLoadingSkeleton()
        ) : error ? (
          renderError()
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
                refreshing={isSyncing}
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
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: 20,
  },
  retryText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },
});
