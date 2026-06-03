/**
 * Settings Screen
 * User settings and preferences
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Typography, Spacing, Radius, ColorPalette } from '../../../constants';
import { t } from '../../../lib/i18n';
import QRCodeModal from '../../../components/QRCodeModal';
import { useAuthStore } from '../../../store/authStore';
import { useAuth } from '../../../hooks/useAuth';
import { useColors } from '../../../hooks/useColors';

export default function SettingsScreen() {
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { colors, isDark, setTheme } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Get user data from store
  const userId = user?.uid || 'unknown';
  const userName = user?.displayName || 'User';
  const userAbout = user?.about || t('auth.defaultAbout');
  const userAvatar = user?.avatarUrl || null;

  const SettingsItem = ({
    icon,
    label,
    onPress,
    showChevron = true,
    color,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    showChevron?: boolean;
    color?: string;
  }) => (
    <Pressable style={styles.settingsItem} onPress={onPress}>
      <View style={[styles.iconContainer, color ? { backgroundColor: color + '20' } : {}]}>
        <Ionicons name={icon} size={22} color={color || colors.primary} />
      </View>
      <Text style={[styles.settingsLabel, color ? { color } : {}]}>{label}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </Pressable>
  );

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      'Are you sure you want to log out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              router.replace('/(auth)/welcome');
            } else {
              Alert.alert(t('common.error'), result.error || 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <Ionicons name="search-outline" size={24} color={colors.textInverse} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section — tap info to edit, QR icon for QR code */}
        <Pressable
          style={styles.profileSection}
          onPress={() => router.push('/(tabs)/settings/edit-profile')}
        >
          <View style={styles.avatar}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} contentFit="cover" transition={200} />
            ) : (
              <Ionicons name="person" size={40} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileAbout} numberOfLines={1}>{userAbout}</Text>
          </View>
          <Pressable onPress={() => setQrModalVisible(true)} hitSlop={12}>
            <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
          </Pressable>
        </Pressable>

        {/* Account */}
        <View style={styles.section}>
          <SettingsItem
            icon="person-outline"
            label={t('settings.editProfile')}
            onPress={() => router.push('/(tabs)/settings/edit-profile')}
          />
          <SettingsItem
            icon="key-outline"
            label={t('settings.account')}
            onPress={() => router.push('/(tabs)/settings/account')}
          />
          <SettingsItem
            icon="lock-closed-outline"
            label={t('settings.privacy')}
            onPress={() => router.push('/(tabs)/settings/privacy')}
          />
          <SettingsItem
            icon="shield-checkmark-outline"
            label={t('settings.security')}
            onPress={() => router.push('/(tabs)/settings/security')}
          />
        </View>

        {/* Chats / notifications / storage */}
        <View style={styles.section}>
          <SettingsItem
            icon="chatbubble-outline"
            label={t('settings.chatsSettings')}
            onPress={() => router.push('/(tabs)/settings/chats')}
          />
          <SettingsItem
            icon="notifications-outline"
            label={t('settings.notifications')}
            onPress={() => router.push('/(tabs)/settings/notifications')}
          />
          <SettingsItem
            icon="server-outline"
            label={t('settings.storage')}
            onPress={() => router.push('/(tabs)/settings/storage')}
          />
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <View style={styles.settingsItem}>
            <View style={styles.iconContainer}>
              <Ionicons name="moon-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.settingsLabel}>{t('settings.darkMode')}</Text>
            <Switch
              value={isDark}
              onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
              trackColor={{ false: colors.surfaceAlt, true: colors.primaryLight }}
              thumbColor={isDark ? colors.primary : '#FFFFFF'}
              ios_backgroundColor={colors.surfaceAlt}
            />
          </View>
        </View>

        {/* Language / help */}
        <View style={styles.section}>
          <SettingsItem
            icon="language-outline"
            label={t('settings.language')}
            onPress={() => router.push('/(tabs)/settings/language')}
          />
          <SettingsItem
            icon="help-circle-outline"
            label={t('settings.help')}
            onPress={() => router.push('/(tabs)/settings/help')}
          />
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <SettingsItem
            icon="log-out-outline"
            label={t('settings.logout')}
            color={colors.error}
            showChevron={false}
            onPress={handleLogout}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>CamChat v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ in Cameroon 🇨🇲</Text>
        </View>
      </ScrollView>

      <QRCodeModal
        visible={qrModalVisible}
        userId={userId}
        userName={userName}
        onClose={() => setQrModalVisible(false)}
      />
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
      paddingVertical: Spacing.md,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.size.xl,
      color: colors.textInverse,
    },
    content: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    profileInfo: {
      flex: 1,
      marginLeft: Spacing.md,
    },
    profileName: {
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.lg,
      color: colors.textPrimary,
    },
    profileAbout: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    section: {
      backgroundColor: colors.background,
      marginTop: Spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.divider,
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      minHeight: 56,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsLabel: {
      flex: 1,
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.md,
      color: colors.textPrimary,
      marginLeft: Spacing.md,
    },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    versionText: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
    },
    versionSubtext: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.xs,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
  });
