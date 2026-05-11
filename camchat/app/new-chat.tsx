/**
 * New Chat Screen
 * Contact picker to start a new conversation
 */

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants';
import { t } from '../lib/i18n';
import { ContactRow } from '../components/chat';
import { User } from '../types';

// Mock contacts for UI development - will be replaced with synced contacts
const MOCK_CONTACTS: User[] = [
  {
    uid: 'user2',
    phone: '+237 655 123 456',
    displayName: 'Marie Ngono',
    about: "Hey, I'm on CamChat 🦁",
    avatarUrl: '',
    language: 'fr',
    isOnline: true,
    lastSeen: new Date(),
    fcmToken: '',
    contacts: [],
    createdAt: new Date(),
  },
  {
    uid: 'user3',
    phone: '+237 677 234 567',
    displayName: 'Jean-Pierre Kamga',
    about: 'Busy coding...',
    avatarUrl: '',
    language: 'en',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
    fcmToken: '',
    contacts: [],
    createdAt: new Date(),
  },
  {
    uid: 'user4',
    phone: '+237 699 345 678',
    displayName: 'Aminatou Bello',
    about: 'Living the dream ✨',
    avatarUrl: '',
    language: 'fr',
    isOnline: true,
    lastSeen: new Date(),
    fcmToken: '',
    contacts: [],
    createdAt: new Date(),
  },
  {
    uid: 'user5',
    phone: '+237 622 456 789',
    displayName: 'Emmanuel Fotso',
    about: 'Football fan ⚽',
    avatarUrl: '',
    language: 'fr',
    isOnline: false,
    lastSeen: new Date(Date.now() - 86400000),
    fcmToken: '',
    contacts: [],
    createdAt: new Date(),
  },
  {
    uid: 'user6',
    phone: '+237 688 567 890',
    displayName: 'Sylvie Mbah',
    about: 'Entrepreneur 💼',
    avatarUrl: '',
    language: 'en',
    isOnline: true,
    lastSeen: new Date(),
    fcmToken: '',
    contacts: [],
    createdAt: new Date(),
  },
];

export default function NewChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = MOCK_CONTACTS.filter(
    (contact) =>
      contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const handleSelectContact = useCallback((contact: User) => {
    // TODO: Check if chat exists, create if not, then navigate
    router.push(`/(tabs)/chats/${contact.uid}`);
  }, []);

  const handleNewGroup = useCallback(() => {
    router.push('/new-group');
  }, []);

  const renderContact = useCallback(
    ({ item }: { item: User }) => (
      <ContactRow contact={item} onPress={() => handleSelectContact(item)} />
    ),
    [handleSelectContact]
  );

  const renderSectionHeader = () => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>Contacts on CamChat</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="person-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No contacts found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Sync your contacts to find friends on CamChat'}
              </Text>
            </View>
          }
        />
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
});
