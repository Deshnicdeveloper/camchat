/**
 * Profile Setup Screen
 * User sets their display name and avatar
 */

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Typography, Spacing, Radius, ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { t } from '../../lib/i18n';
import { useAuth } from '../../hooks/useAuth';
import { uploadAvatarFromUri } from '../../lib/storage';
import { getCurrentFirebaseUser } from '../../lib/auth';

// Default about text with lion emoji (Cameroonian cultural identity)
const DEFAULT_ABOUT = "Hey, I'm on CamChat 🦁";

export default function ProfileSetupScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { completeProfile } = useAuth();

  const handlePickImage = async () => {
    // Request permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        t('common.error'),
        t('auth.photoPermissionRequired'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleDone = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);

    try {
      let finalAvatarUrl = '';

      // Upload avatar to Supabase if selected
      if (avatarUri) {
        const firebaseUser = getCurrentFirebaseUser();
        if (firebaseUser) {
          console.log('📤 Uploading avatar to Supabase...');
          const uploadResult = await uploadAvatarFromUri(firebaseUser.uid, avatarUri);

          if (uploadResult.success && uploadResult.url) {
            finalAvatarUrl = uploadResult.url;
            console.log('✅ Avatar uploaded:', finalAvatarUrl);
          } else {
            console.warn('⚠️ Avatar upload failed:', uploadResult.error);
            // Continue without avatar - don't block profile creation
          }
        }
      }

      // Create profile with uploaded avatar URL
      const result = await completeProfile(
        displayName.trim(),
        about.trim() || DEFAULT_ABOUT,
        finalAvatarUrl
      );

      setIsSaving(false);

      if (result.success) {
        // Navigate to main app
        router.replace('/(tabs)/chats');
      } else {
        Alert.alert(
          t('common.error'),
          result.error || t('auth.profileSetupError'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      console.error('Error in handleDone:', error);
      setIsSaving(false);
      Alert.alert(
        t('common.error'),
        t('auth.profileSetupError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const isValid = displayName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.title}>{t('auth.profileTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.profileSubtitle')}</Text>

              {/* Avatar Picker */}
              <Pressable style={styles.avatarContainer} onPress={handlePickImage}>
                <View style={styles.avatar}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={48} color={colors.textSecondary} />
                  )}
                </View>
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={18} color={colors.textInverse} />
                </View>
              </Pressable>

              {/* Input Card */}
              <View style={styles.card}>
                {/* Display Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('auth.displayName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textSecondary}
                    value={displayName}
                    onChangeText={setDisplayName}
                    maxLength={25}
                    autoFocus
                  />
                </View>

                <View style={styles.divider} />

                {/* About Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('auth.about')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="About"
                    placeholderTextColor={colors.textSecondary}
                    value={about}
                    onChangeText={setAbout}
                    maxLength={139}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Done Button */}
            <View style={styles.footer}>
              <Pressable
                style={[styles.button, (!isValid || isSaving) && styles.buttonDisabled]}
                onPress={handleDone}
                disabled={!isValid || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
                    {t('common.done')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.textInverse,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  card: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  inputContainer: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: colors.primary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  button: {
    backgroundColor: colors.textInverse,
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
    color: colors.primary,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});
