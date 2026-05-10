/**
 * New Group Screen
 * Create a new group chat
 */

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants';
import { t } from '../lib/i18n';

export default function NewGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  const handleCreateGroup = () => {
    if (groupName.trim().length > 0) {
      // TODO: Create group and navigate
      router.back();
    }
  };

  const isValid = groupName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('groups.newGroup')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Group Avatar */}
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="people" size={48} color={Colors.textSecondary} />
            </View>
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

        {/* Add Participants Section */}
        <Pressable style={styles.addParticipantsSection}>
          <View style={styles.addIcon}>
            <Ionicons name="person-add" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.addParticipantsText}>{t('groups.addParticipants')}</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </Pressable>

        {/* Participants placeholder */}
        <View style={styles.participantsPlaceholder}>
          <Text style={styles.placeholderText}>
            No participants added yet
          </Text>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleCreateGroup}
          disabled={!isValid}
        >
          <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
            {t('groups.createGroup')}
          </Text>
        </Pressable>
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
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  addParticipantsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  addIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  addParticipantsText: {
    flex: 1,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  participantsPlaceholder: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
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
