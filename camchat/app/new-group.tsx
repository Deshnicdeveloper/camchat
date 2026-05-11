/**
 * New Group Screen
 * Two-step flow: 1) Select participants 2) Set group info and create
 */

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../constants';
import { t } from '../lib/i18n';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { syncContacts } from '../lib/contacts';
import { createGroupChat } from '../lib/chat';
import { uploadAvatar } from '../lib/storage';
import type { Contact } from '../types';

type Step = 'participants' | 'info';

export default function NewGroupScreen() {
  // State
  const [step, setStep] = useState<Step>('participants');
  const [selectedParticipants, setSelectedParticipants] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatarUri, setGroupAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Store
  const { contacts, setContacts } = useChatStore();
  const { user } = useAuthStore();

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    try {
      const result = await syncContacts(user.uid);
      if (result.success) {
        setContacts(result.contacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.includes(query)
    );
  }, [contacts, searchQuery]);

  // Toggle participant selection
  const toggleParticipant = useCallback((contact: Contact) => {
    setSelectedParticipants((prev) => {
      const isSelected = prev.some((p) => p.id === contact.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== contact.id);
      } else {
        if (prev.length >= 256) {
          Alert.alert(t('common.error'), 'Maximum 256 participants allowed');
          return prev;
        }
        return [...prev, contact];
      }
    });
  }, []);

  // Check if a contact is selected
  const isSelected = useCallback(
    (contact: Contact) => selectedParticipants.some((p) => p.id === contact.id),
    [selectedParticipants]
  );

  // Remove participant from selection
  const removeParticipant = useCallback((contact: Contact) => {
    setSelectedParticipants((prev) => prev.filter((p) => p.id !== contact.id));
  }, []);

  // Handle next step
  const handleNext = () => {
    if (selectedParticipants.length === 0) {
      Alert.alert(t('common.error'), 'Please select at least one participant');
      return;
    }
    setStep('info');
  };

  // Handle back
  const handleBack = () => {
    if (step === 'info') {
      setStep('participants');
    } else {
      router.back();
    }
  };

  // Pick group avatar
  const pickGroupAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), 'Failed to pick image');
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (!user?.uid) {
      Alert.alert(t('common.error'), 'Not authenticated');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a group name');
      return;
    }

    setIsCreating(true);

    try {
      // Upload avatar if selected
      let groupAvatarUrl: string | undefined;
      if (groupAvatarUri) {
        const uploadResult = await uploadAvatar(groupAvatarUri, `group_${Date.now()}`);
        if (uploadResult.success && uploadResult.url) {
          groupAvatarUrl = uploadResult.url;
        }
      }

      // Get participant IDs
      const participantIds = selectedParticipants
        .map((p) => p.userId)
        .filter((id): id is string => !!id);

      // Create group
      const result = await createGroupChat(
        user.uid,
        groupName.trim(),
        participantIds,
        groupDescription.trim() || undefined,
        groupAvatarUrl
      );

      if (result.success && result.chatId) {
        console.log('✅ Group created successfully:', result.chatId);
        // Navigate to the new group chat
        router.replace(`/(tabs)/chats/${result.chatId}`);
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 'Failed to create group'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Render contact item
  const renderContactItem = ({ item }: { item: Contact }) => {
    const selected = isSelected(item);

    return (
      <Pressable
        style={styles.contactRow}
        onPress={() => toggleParticipant(item)}
      >
        <View style={styles.contactInfo}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.contactAvatar} />
          ) : (
            <View style={[styles.contactAvatar, styles.contactAvatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactPhone}>{item.phone}</Text>
          </View>
        </View>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && (
            <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
          )}
        </View>
      </Pressable>
    );
  };

  // Render selected participant chip
  const renderSelectedChip = (contact: Contact) => (
    <Pressable
      key={contact.id}
      style={styles.selectedChip}
      onPress={() => removeParticipant(contact)}
    >
      {contact.avatarUrl ? (
        <Image source={{ uri: contact.avatarUrl }} style={styles.chipAvatar} />
      ) : (
        <View style={[styles.chipAvatar, styles.chipAvatarPlaceholder]}>
          <Text style={styles.chipInitial}>
            {contact.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text style={styles.chipName} numberOfLines={1}>
        {contact.name.split(' ')[0]}
      </Text>
      <View style={styles.chipRemove}>
        <Ionicons name="close" size={12} color={Colors.textSecondary} />
      </View>
    </Pressable>
  );

  // Determine if we can proceed
  const canProceed = step === 'participants'
    ? selectedParticipants.length > 0
    : groupName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {step === 'participants' ? t('groups.addParticipants') : t('groups.newGroup')}
          </Text>
          {step === 'participants' && selectedParticipants.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {selectedParticipants.length} {t('groups.participants').toLowerCase()}
            </Text>
          )}
        </View>
        {step === 'participants' ? (
          <Pressable
            onPress={handleNext}
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            disabled={!canProceed}
          >
            <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>
              {t('common.next')}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      {step === 'participants' ? (
        /* Step 1: Select Participants */
        <View style={styles.content}>
          {/* Selected Participants */}
          {selectedParticipants.length > 0 && (
            <View style={styles.selectedSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedScrollContent}
              >
                {selectedParticipants.map(renderSelectedChip)}
              </ScrollView>
            </View>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
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

          {/* Contacts List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No contacts found' : 'No contacts available'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        /* Step 2: Group Info */
        <ScrollView style={styles.infoContent} keyboardShouldPersistTaps="handled">
          {/* Group Avatar */}
          <View style={styles.avatarSection}>
            <Pressable style={styles.avatarContainer} onPress={pickGroupAvatar}>
              {groupAvatarUri ? (
                <Image source={{ uri: groupAvatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="people" size={48} color={Colors.textSecondary} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={18} color={Colors.textInverse} />
              </View>
            </Pressable>
          </View>

          {/* Group Info Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('groups.groupName')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                placeholderTextColor={Colors.textSecondary}
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
                autoFocus
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('groups.groupDescription')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a group description (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={groupDescription}
                onChangeText={setGroupDescription}
                maxLength={250}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Participants Summary */}
          <View style={styles.participantsSummary}>
            <Text style={styles.summaryTitle}>
              {t('groups.participants')}: {selectedParticipants.length}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.summaryAvatars}
            >
              {selectedParticipants.slice(0, 10).map((contact) => (
                <View key={contact.id} style={styles.summaryAvatarContainer}>
                  {contact.avatarUrl ? (
                    <Image
                      source={{ uri: contact.avatarUrl }}
                      style={styles.summaryAvatar}
                    />
                  ) : (
                    <View style={[styles.summaryAvatar, styles.summaryAvatarPlaceholder]}>
                      <Text style={styles.summaryInitial}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {selectedParticipants.length > 10 && (
                <View style={[styles.summaryAvatar, styles.summaryAvatarMore]}>
                  <Text style={styles.summaryMoreText}>
                    +{selectedParticipants.length - 10}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Create Button */}
          <View style={styles.createButtonContainer}>
            <Pressable
              style={[styles.button, (!canProceed || isCreating) && styles.buttonDisabled]}
              onPress={handleCreateGroup}
              disabled={!canProceed || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={Colors.textInverse} />
              ) : (
                <Text style={[styles.buttonText, !canProceed && styles.buttonTextDisabled]}>
                  {t('groups.createGroup')}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    opacity: 0.8,
    marginTop: 2,
  },
  nextButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  nextButtonTextDisabled: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  infoContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Selected participants section
  selectedSection: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  selectedScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  selectedChip: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 64,
  },
  chipAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  chipAvatarPlaceholder: {
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInitial: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.primary,
  },
  chipName: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  chipRemove: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },

  // Contact list
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contactAvatarPlaceholder: {
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.primary,
  },
  contactDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  contactName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Loading & Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },

  // Group info section
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  form: {
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  inputContainer: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
  },

  // Participants summary
  participantsSummary: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  summaryTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryAvatars: {
    flexDirection: 'row',
  },
  summaryAvatarContainer: {
    marginRight: -8,
  },
  summaryAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  summaryAvatarPlaceholder: {
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInitial: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.primary,
  },
  summaryAvatarMore: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryMoreText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
  },

  // Create button
  createButtonContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});
