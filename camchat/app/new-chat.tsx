/**
 * New Chat Screen
 * Contact picker to start a new conversation with synced contacts
 */

import { useState, useCallback, useEffect } from 'react';
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
import { Colors, Typography, Spacing, Radius } from '../constants';
import { t } from '../lib/i18n';
import { ContactRow } from '../components/chat';
import { SkeletonChatRow } from '../components/ui/Skeleton';
import { useContacts } from '../hooks/useContacts';
import { useChat } from '../hooks/useChat';
import type { User } from '../types';

export default function NewChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);

  const {
    registeredContacts,
    isLoading,
    isSyncing,
    hasPermission,
    error,
    sync,
    requestPermission,
  } = useContacts();

  const { startChat } = useChat();

  // Auto-sync contacts on mount if we have permission but no contacts
  useEffect(() => {
    if (hasPermission && registeredContacts.length === 0 && !isSyncing && !isLoading) {
      sync();
    }
  }, [hasPermission, registeredContacts.length, isSyncing, isLoading, sync]);

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
      <Ionicons name="people-outline" size={64} color={Colors.primary} />
      <Text style={styles.permissionTitle}>{t('contacts.syncContacts')}</Text>
      <Text style={styles.permissionSubtext}>
        {t('contacts.syncDescription')}
      </Text>
      <Pressable style={styles.syncButton} onPress={handleRequestPermission}>
        <Ionicons name="sync" size={20} color={Colors.textInverse} />
        <Text style={styles.syncButtonText}>{t('contacts.allowAccess')}</Text>
      </Pressable>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="person-outline" size={48} color={Colors.textSecondary} />
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
          <ActivityIndicator size="large" color={Colors.textInverse} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('chats.newChat')}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* New Group Option */}
        <Pressable style={styles.newGroupRow} onPress={handleNewGroup}>
          <View style={styles.newGroupIcon}>
            <Ionicons name="people" size={24} color={Colors.textInverse} />
          </View>
          <Text style={styles.newGroupText}>{t('groups.newGroup')}</Text>
        </Pressable>

        {!hasPermission ? (
          renderPermissionPrompt()
        ) : isLoading || isSyncing ? (
          renderLoadingSkeleton()
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="warning-outline" size={48} color={Colors.error} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
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
    backgroundColor: Colors.primary,
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
    color: Colors.textInverse,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  newGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  newGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  newGroupText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  sectionHeaderText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
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
  refreshButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  refreshButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
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
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  permissionSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.size.sm * 1.5,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 24,
  },
  syncButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
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
  retryButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },
});
