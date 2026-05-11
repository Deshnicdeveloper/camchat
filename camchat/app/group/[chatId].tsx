/**
 * Group Info Screen
 * View and manage group details, participants, and settings
 */

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import {
  getChatById,
  updateGroupInfo,
  addParticipantsToGroup,
  removeParticipantFromGroup,
  leaveGroup,
  makeParticipantAdmin,
  removeAdminStatus,
  getGroupAdmins,
} from '../../lib/chat';
import { getUsersByIds, syncContacts } from '../../lib/contacts';
import { uploadAvatarFromUri } from '../../lib/storage';
import type { Chat, UserProfile, Contact } from '../../types';

type ActionSheetAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

export default function GroupInfoScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuthStore();
  const { contacts, setContacts } = useChatStore();

  // State
  const [chat, setChat] = useState<Chat | null>(null);
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [selectedNewParticipants, setSelectedNewParticipants] = useState<Contact[]>([]);

  // Check if current user is admin
  const isAdmin = user?.uid ? admins.includes(user.uid) : false;
  const isCreator = chat?.createdBy === user?.uid;

  // Load group data
  useEffect(() => {
    loadGroupData();
  }, [chatId]);

  const loadGroupData = async () => {
    if (!chatId) return;

    setIsLoading(true);
    try {
      // Get chat details
      const chatResult = await getChatById(chatId);
      if (chatResult.success && chatResult.chat) {
        setChat(chatResult.chat);
        setEditedName(chatResult.chat.groupName || '');
        setEditedDescription(chatResult.chat.groupDescription || '');

        // Get participants
        if (chatResult.chat.participants.length > 0) {
          const users = await getUsersByIds(chatResult.chat.participants);
          setParticipants(
            users.map((u) => ({
              uid: u.uid,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
              about: u.about,
              isOnline: u.isOnline,
              lastSeen: u.lastSeen,
            }))
          );
        }

        // Get admins
        const groupAdmins = await getGroupAdmins(chatId);
        setAdmins(groupAdmins);
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert(t('common.error'), 'Failed to load group info');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit group info
  const handleSaveChanges = async () => {
    if (!chatId || !user?.uid) return;

    if (!editedName.trim()) {
      Alert.alert(t('common.error'), 'Group name cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateGroupInfo(chatId, user.uid, {
        groupName: editedName.trim(),
        groupDescription: editedDescription.trim(),
      });

      if (result.success) {
        setChat((prev) =>
          prev
            ? {
                ...prev,
                groupName: editedName.trim(),
                groupDescription: editedDescription.trim(),
              }
            : null
        );
        setIsEditing(false);
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to update group');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert(t('common.error'), 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Pick new group avatar
  const handlePickAvatar = async () => {
    if (!isAdmin || !chatId || !user?.uid) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsSaving(true);
        const uploadResult = await uploadAvatarFromUri(
          `group_${chatId}`,
          result.assets[0].uri
        );

        if (uploadResult.success && uploadResult.url) {
          const updateResult = await updateGroupInfo(chatId, user.uid, {
            groupAvatarUrl: uploadResult.url,
          });

          if (updateResult.success) {
            setChat((prev) =>
              prev ? { ...prev, groupAvatarUrl: uploadResult.url } : null
            );
          }
        }
        setIsSaving(false);
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      setIsSaving(false);
    }
  };

  // Handle participant actions
  const handleParticipantPress = (participant: UserProfile) => {
    if (!user?.uid || participant.uid === user.uid) return;

    const actions: ActionSheetAction[] = [
      {
        label: 'View Profile',
        onPress: () => router.push(`/profile/${participant.uid}`),
      },
      {
        label: 'Message',
        onPress: () => {
          // Navigate to direct chat with this user
          router.push(`/(tabs)/chats`);
        },
      },
    ];

    if (isAdmin && participant.uid !== chat?.createdBy) {
      const participantIsAdmin = admins.includes(participant.uid);

      if (participantIsAdmin) {
        actions.push({
          label: 'Remove Admin',
          onPress: () => handleRemoveAdmin(participant.uid),
        });
      } else {
        actions.push({
          label: 'Make Admin',
          onPress: () => handleMakeAdmin(participant.uid),
        });
      }

      actions.push({
        label: 'Remove from Group',
        onPress: () => handleRemoveParticipant(participant.uid, participant.displayName),
        destructive: true,
      });
    }

    // Show action sheet (simplified using Alert for now)
    Alert.alert(
      participant.displayName,
      undefined,
      [
        ...actions.map((action) => ({
          text: action.label,
          onPress: action.onPress,
          style: action.destructive ? ('destructive' as const) : ('default' as const),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Make participant admin
  const handleMakeAdmin = async (participantId: string) => {
    if (!chatId || !user?.uid) return;

    try {
      const result = await makeParticipantAdmin(chatId, user.uid, participantId);
      if (result.success) {
        setAdmins((prev) => [...prev, participantId]);
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to make admin');
      }
    } catch (error) {
      console.error('Error making admin:', error);
    }
  };

  // Remove admin status
  const handleRemoveAdmin = async (participantId: string) => {
    if (!chatId || !user?.uid) return;

    try {
      const result = await removeAdminStatus(chatId, user.uid, participantId);
      if (result.success) {
        setAdmins((prev) => prev.filter((id) => id !== participantId));
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  };

  // Remove participant
  const handleRemoveParticipant = async (participantId: string, name: string) => {
    if (!chatId || !user?.uid) return;

    Alert.alert(
      'Remove Participant',
      `Are you sure you want to remove ${name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeParticipantFromGroup(
                chatId,
                user.uid,
                participantId
              );
              if (result.success) {
                setParticipants((prev) =>
                  prev.filter((p) => p.uid !== participantId)
                );
                setChat((prev) =>
                  prev
                    ? {
                        ...prev,
                        participants: prev.participants.filter(
                          (id) => id !== participantId
                        ),
                      }
                    : null
                );
              } else {
                Alert.alert(t('common.error'), result.error || 'Failed to remove');
              }
            } catch (error) {
              console.error('Error removing participant:', error);
            }
          },
        },
      ]
    );
  };

  // Leave group
  const handleLeaveGroup = () => {
    if (!chatId || !user?.uid) return;

    const message = isCreator
      ? 'Are you sure you want to leave this group? Another admin will become the group creator.'
      : 'Are you sure you want to leave this group?';

    Alert.alert(t('groups.leaveGroup'), message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await leaveGroup(chatId, user.uid);
            if (result.success) {
              router.replace('/(tabs)/chats');
            } else {
              Alert.alert(t('common.error'), result.error || 'Failed to leave group');
            }
          } catch (error) {
            console.error('Error leaving group:', error);
          }
        },
      },
    ]);
  };

  // Load contacts for adding participants
  const loadContacts = async () => {
    if (!user?.uid) return;

    try {
      const result = await syncContacts(user.uid);
      if (result.success) {
        setContacts(result.contacts);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  // Add participants
  const handleAddParticipants = async () => {
    if (!chatId || !user?.uid || selectedNewParticipants.length === 0) return;

    try {
      const newIds = selectedNewParticipants
        .map((c) => c.userId)
        .filter((id): id is string => !!id);

      const result = await addParticipantsToGroup(chatId, user.uid, newIds);

      if (result.success) {
        // Reload group data
        await loadGroupData();
        setShowAddParticipants(false);
        setSelectedNewParticipants([]);
      } else {
        Alert.alert(t('common.error'), result.error || 'Failed to add participants');
      }
    } catch (error) {
      console.error('Error adding participants:', error);
    }
  };

  // Get contacts not already in group
  const availableContacts = contacts.filter(
    (contact) => contact.userId && !chat?.participants.includes(contact.userId)
  );

  // Render participant item
  const renderParticipant = ({ item }: { item: UserProfile }) => {
    const isParticipantAdmin = admins.includes(item.uid);
    const isParticipantCreator = item.uid === chat?.createdBy;
    const isCurrentUser = item.uid === user?.uid;

    return (
      <Pressable
        style={styles.participantRow}
        onPress={() => handleParticipantPress(item)}
        disabled={isCurrentUser}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.participantAvatar} />
        ) : (
          <View style={[styles.participantAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.participantInfo}>
          <View style={styles.participantNameRow}>
            <Text style={styles.participantName}>
              {item.displayName}
              {isCurrentUser && ' (You)'}
            </Text>
            {(isParticipantAdmin || isParticipantCreator) && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>
                  {isParticipantCreator ? 'Creator' : 'Admin'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.participantAbout} numberOfLines={1}>
            {item.about || 'Hey there! I am using CamChat'}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Add Participants Modal
  if (showAddParticipants) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowAddParticipants(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('groups.addParticipants')}</Text>
          <Pressable
            onPress={handleAddParticipants}
            style={styles.headerAction}
            disabled={selectedNewParticipants.length === 0}
          >
            <Text
              style={[
                styles.headerActionText,
                selectedNewParticipants.length === 0 && styles.headerActionTextDisabled,
              ]}
            >
              Add
            </Text>
          </Pressable>
        </View>

        <View style={styles.addParticipantsContent}>
          {selectedNewParticipants.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedCount}>
                {selectedNewParticipants.length} selected
              </Text>
            </View>
          )}

          {availableContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No contacts available to add</Text>
            </View>
          ) : (
            <FlatList
              data={availableContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selectedNewParticipants.some((p) => p.id === item.id);
                return (
                  <Pressable
                    style={styles.contactRow}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedNewParticipants((prev) =>
                          prev.filter((p) => p.id !== item.id)
                        );
                      } else {
                        setSelectedNewParticipants((prev) => [...prev, item]);
                      }
                    }}
                  >
                    {item.avatarUrl ? (
                      <Image source={{ uri: item.avatarUrl }} style={styles.contactAvatar} />
                    ) : (
                      <View style={[styles.contactAvatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitial}>
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactPhone}>{item.phone}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={Colors.textInverse} />
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          )}
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
        <Text style={styles.headerTitle}>{t('groups.groupInfo')}</Text>
        {isAdmin && !isEditing && (
          <Pressable onPress={() => setIsEditing(true)} style={styles.headerAction}>
            <Ionicons name="pencil" size={20} color={Colors.textInverse} />
          </Pressable>
        )}
        {isEditing && (
          <Pressable
            onPress={handleSaveChanges}
            style={styles.headerAction}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Text style={styles.headerActionText}>Save</Text>
            )}
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Group Avatar & Name */}
        <View style={styles.profileSection}>
          <Pressable
            style={styles.avatarContainer}
            onPress={isAdmin ? handlePickAvatar : undefined}
            disabled={!isAdmin}
          >
            {chat.groupAvatarUrl ? (
              <Image source={{ uri: chat.groupAvatarUrl }} style={styles.groupAvatar} />
            ) : (
              <View style={[styles.groupAvatar, styles.groupAvatarPlaceholder]}>
                <Ionicons name="people" size={48} color={Colors.textSecondary} />
              </View>
            )}
            {isAdmin && (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={16} color={Colors.textInverse} />
              </View>
            )}
          </Pressable>

          {isEditing ? (
            <TextInput
              style={styles.editNameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Group name"
              placeholderTextColor={Colors.textSecondary}
              maxLength={50}
            />
          ) : (
            <Text style={styles.groupName}>{chat.groupName}</Text>
          )}

          <Text style={styles.participantCount}>
            {participants.length} {t('groups.participants').toLowerCase()}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('groups.groupDescription')}</Text>
          {isEditing ? (
            <TextInput
              style={styles.editDescriptionInput}
              value={editedDescription}
              onChangeText={setEditedDescription}
              placeholder="Add group description"
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={250}
            />
          ) : (
            <Text style={styles.descriptionText}>
              {chat.groupDescription || 'No description'}
            </Text>
          )}
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {participants.length} {t('groups.participants')}
            </Text>
            {isAdmin && (
              <Pressable
                onPress={() => {
                  loadContacts();
                  setShowAddParticipants(true);
                }}
              >
                <Ionicons name="person-add" size={22} color={Colors.primary} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={participants}
            renderItem={renderParticipant}
            keyExtractor={(item) => item.uid}
            scrollEnabled={false}
          />
        </View>

        {/* Leave Group */}
        <View style={styles.dangerSection}>
          <Pressable style={styles.leaveButton} onPress={handleLeaveGroup}>
            <Ionicons name="exit-outline" size={24} color={Colors.error} />
            <Text style={styles.leaveButtonText}>{t('groups.leaveGroup')}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
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
    flex: 1,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  headerActionTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
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

  // Profile section
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatarContainer: {
    position: 'relative',
  },
  groupAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  groupAvatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  groupName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  editNameInput: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: Spacing.xs,
    minWidth: 200,
  },
  participantCount: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Sections
  section: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  descriptionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: Typography.size.md * 1.5,
  },
  editDescriptionInput: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Participants
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.primary,
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  adminBadge: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginLeft: Spacing.sm,
  },
  adminBadgeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: Colors.primary,
  },
  participantAbout: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Danger section
  dangerSection: {
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  leaveButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.error,
    marginLeft: Spacing.sm,
  },

  // Add participants modal
  addParticipantsContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  selectedSection: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  selectedCount: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
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
});
