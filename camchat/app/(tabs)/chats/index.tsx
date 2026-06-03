/**
 * Chats Screen
 * Displays list of all conversations with real-time updates
 */

import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, ColorPalette } from '../../../constants';
import { t } from '../../../lib/i18n';
import { ChatRow } from '../../../components/chat';
import { SkeletonChatRow } from '../../../components/ui/Skeleton';
import { Chat } from '../../../types';
import { useChat } from '../../../hooks/useChat';
import { useContacts } from '../../../hooks/useContacts';
import { useAuthStore } from '../../../store/authStore';
import { useColors } from '../../../hooks/useColors';

export default function ChatsScreen() {
  const { user } = useAuthStore();
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const [searchQuery, setSearchQuery] = useState('');

  // Note: contact sync is handled (throttled) inside useContacts. We no longer
  // trigger a full device sync on every mount of this screen — that was a major
  // source of latency. Pull-to-refresh still forces a sync.

  const handleRefresh = useCallback(async () => {
    await syncContacts();
  }, [syncContacts]);

  const handleChatPress = useCallback(
    async (chatId: string) => {
      // Navigate immediately; reset unread in the background (don't block the UI)
      router.push(`/(tabs)/chats/${chatId}`);
      openChat(chatId).catch(() => {});
    },
    [openChat]
  );

  const handleNewChat = useCallback(() => {
    router.push('/new-chat');
  }, []);

  const handleArchive = useCallback((chatId: string) => archiveChat(chatId), [archiveChat]);
  const handleMute = useCallback((chatId: string) => muteChat(chatId), [muteChat]);
  const handleDelete = useCallback((chatId: string) => deleteChat(chatId), [deleteChat]);

  // Local, instant search over the already-loaded chats
  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((chat) => {
      const name =
        chat.type === 'group'
          ? chat.groupName || ''
          : getChatParticipant(chat)?.displayName || '';
      const last = chat.lastMessage?.text || '';
      return name.toLowerCase().includes(q) || last.toLowerCase().includes(q);
    });
  }, [chats, searchQuery, getChatParticipant]);

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
      <Ionicons
        name={searchQuery ? 'search-outline' : 'chatbubbles-outline'}
        size={72}
        color={colors.primary}
      />
      <Text style={styles.emptyText}>
        {searchQuery ? t('contacts.noResults') : t('chats.noChats')}
      </Text>
      {!searchQuery && (
        <Pressable style={styles.startChatButton} onPress={handleNewChat}>
          <Ionicons name="create-outline" size={20} color={colors.textInverse} />
          <Text style={styles.startChatText}>{t('chats.newChat')}</Text>
        </Pressable>
      )}
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
      <Ionicons name="warning-outline" size={48} color={colors.error} />
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
        <Pressable onPress={handleNewChat} style={styles.headerButton} hitSlop={8}>
          <Ionicons name="create-outline" size={24} color={colors.textInverse} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Chat List */}
      <View style={styles.content}>
        {isLoading && chats.length === 0 ? (
          renderLoadingSkeleton()
        ) : error ? (
          renderError()
        ) : filteredChats.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isSyncing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>

      {/* Floating action button (WhatsApp-style) */}
      <Pressable style={styles.fab} onPress={handleNewChat}>
        <Ionicons name="chatbubble-ellipses" size={26} color={colors.textInverse} />
      </Pressable>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.size.xl,
      color: colors.textInverse,
    },
    headerButton: {
      padding: Spacing.xs,
    },
    searchWrap: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.md,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    content: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      flexGrow: 1,
      paddingBottom: 96, // space so the FAB doesn't cover the last row
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
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
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    startChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.full,
    },
    startChatText: {
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.md,
      color: colors.textInverse,
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
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      borderRadius: Radius.full,
    },
    retryText: {
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.sm,
      color: colors.textInverse,
    },
    fab: {
      position: 'absolute',
      right: Spacing.lg,
      bottom: Spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  });
