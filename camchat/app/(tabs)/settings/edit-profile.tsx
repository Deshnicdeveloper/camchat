/**
 * Edit Profile Screen
 * Lets the user update their display name, about text and avatar.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../../constants';
import { t } from '../../../lib/i18n';
import { useAuth } from '../../../hooks/useAuth';
import { uploadAvatarFromUri } from '../../../lib/storage';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [about, setAbout] = useState(user?.about || '');
  // Local preview URI when a new image is picked (not yet uploaded)
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const avatarToShow = pickedUri || user?.avatarUrl || null;

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('common.permissionRequired'), t('auth.photoPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim() || !user?.uid || isSaving) return;

    setIsSaving(true);
    try {
      const updates: { displayName: string; about: string; avatarUrl?: string } = {
        displayName: displayName.trim(),
        about: about.trim(),
      };

      // Upload the new avatar first if one was picked
      if (pickedUri) {
        const uploadResult = await uploadAvatarFromUri(user.uid, pickedUri);
        if (uploadResult.success && uploadResult.url) {
          updates.avatarUrl = uploadResult.url;
        } else {
          throw new Error(uploadResult.error || 'Avatar upload failed');
        }
      }

      const result = await updateProfile(updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      router.back();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('auth.profileSetupError')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = displayName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.editProfile')}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <Pressable style={styles.avatarContainer} onPress={handlePickImage}>
            <View style={styles.avatar}>
              {avatarToShow ? (
                <Image source={{ uri: avatarToShow }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={48} color={Colors.textSecondary} />
              )}
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={18} color={Colors.textInverse} />
            </View>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.displayName')}</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('auth.displayName')}
                placeholderTextColor={Colors.textSecondary}
                maxLength={25}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.field}>
              <Text style={styles.label}>{t('auth.about')}</Text>
              <TextInput
                style={styles.input}
                value={about}
                onChangeText={setAbout}
                placeholder={t('auth.defaultAbout')}
                placeholderTextColor={Colors.textSecondary}
                maxLength={139}
                multiline
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveButton, (!isValid || isSaving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isValid || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
    marginLeft: Spacing.xs,
  },
  body: { flex: 1, backgroundColor: Colors.surface },
  bodyContent: { padding: Spacing.lg, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginVertical: Spacing.lg },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primaryFaded,
  },
  avatarImage: { width: '100%', height: '100%' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  field: { padding: Spacing.lg },
  label: {
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
});
