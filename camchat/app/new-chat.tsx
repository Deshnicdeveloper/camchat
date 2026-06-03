/**
 * New Chat Screen
 * Contact picker to start a new conversation with synced contacts
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, ColorPalette } from '../constants';
import { useColors } from '../hooks/useColors';
import { t } from '../lib/i18n';
import { ContactRow } from '../components/chat';
import { SkeletonChatRow } from '../components/ui/Skeleton';
import { useContacts } from '../hooks/useContacts';
import { useChat } from '../hooks/useChat';
import type { User } from '../types';

export default function NewChatScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  const {
    registeredContacts,
    contacts,
    isLoading,
    isSyncing,
    hasPermission,
    error,
    sync,
    requestPermission,
  } = useContacts();

  const { startChat } = useChat();

  // Auto-sync only when we have no cached contacts at all. Cached contacts +
  // the hook's own TTL throttle prevent the slow device sync running on every
  // open (which made opening this screen take ~30s).
  useEffect(() => {
    if (
      hasPermission &&
      registeredContacts.length === 0 &&
      contacts.length === 0 &&
      !isSyncing &&
      !isLoading
    ) {
      sync();
    }
  }, [hasPermission, registeredContacts.length, contacts.length, isSyncing, isLoading, sync]);

  const filteredContacts = registeredContacts.filter(
    (contact) =>
      contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const handleSelectContact = useCallback(
    async (contact: User) => {
      setIsStartingChat(true);

      try {
        const result = await startChat(contact.uid);

        if (result.success && result.chatId) {
          router.replace(`/(tabs)/chats/${result.chatId}`);
        } else {
          Alert.alert(t('common.error'), result.error || t('chats.createError'));
        }
      } catch (err) {
        console.error('Error starting chat:', err);
        Alert.alert(t('common.error'), t('chats.createError'));
      } finally {
        setIsStartingChat(false);
      }
    },
    [startChat]
  );

  const handleNewGroup = useCallback(() => {
    router.push('/new-group');
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      await sync();
    } else {
      Alert.alert(
        t('common.error'),
        t('contacts.permissionRequired'),
        [{ text: t('common.ok') }]
      );
    }
  }, [requestPermission, sync]);

  const renderContact = useCallback(
    ({ item }: { item: User }) => (
      <ContactRow contact={item} onPress={() => handleSelectContact(item)} />
    ),
    [handleSelectContact]
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {t('contacts.onCamChat')} ({filteredContacts.length})
      </Text>
    </View>
  );

  const renderPermissionPrompt = () => (
    <View style={styles.permissionState}>
      <Ionicons name="people-outline" size={64} color={colors.primary} />
      <Text style={styles.permissionTitle}>{t('contacts.syncContacts')}</Text>
      <Text style={styles.permissionSubtext}>
        {t('contacts.syncDescription')}
      </Text>
      <Pressable style={styles.syncButton} onPress={handleRequestPermission}>
        <Ionicons name="sync" size={20} color={colors.textInverse} />
        <Text style={styles.syncButtonText}>{t('contacts.allowAccess')}</Text>
      </Pressable>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyText}>
        {searchQuery ? t('contacts.noResults') : t('contacts.noContacts')}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? t('contacts.tryDifferentSearch')
          : t('contacts.inviteFriends')}
      </Text>
      {!searchQuery && (
        <Pressable style={styles.refreshButton} onPress={sync}>
          <Text style={styles.refreshButtonText}>{t('contacts.refresh')}</Text>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Loading overlay when starting a chat */}
      {isStartingChat && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.textInverse} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('chats.newChat')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder={t('common.search')}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* New Group Option */}
        <Pressable style={styles.newGroupRow} onPress={handleNewGroup}>
          <View style={styles.newGroupIcon}>
            <Ionicons name="people" size={24} color={colors.textInverse} />
          </View>
          <Text style={styles.newGroupText}>{t('groups.newGroup')}</Text>
        </Pressable>

        {!hasPermission ? (
          renderPermissionPrompt()
        ) : isLoading || isSyncing ? (
          renderLoadingSkeleton()
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="warning-outline" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={sync}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Section Header */}
            {renderSectionHeader()}

            {/* Contacts List */}
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.uid}
              renderItem={renderContact}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={renderEmptyState()}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: colors.textInverse,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: colors.primary,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  newGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  newGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  newGroupText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
  },
  sectionHeaderText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: Spacing.lg + 48 + Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  refreshButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: colors.textInverse,
  },
  permissionState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.size.sm * 1.5,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
  },
  syncButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: colors.textInverse,
    marginLeft: Spacing.sm,
  },
  skeletonContainer: {
    flex: 1,
    paddingTop: Spacing.md,
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
    borderRadius: 20,
  },
  retryButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: colors.textInverse,
  },
});
