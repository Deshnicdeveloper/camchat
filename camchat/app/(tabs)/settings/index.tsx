/**
 * Settings Screen
 * User settings and preferences
 */

import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../../constants';
import { t } from '../../../lib/i18n';
import QRCodeModal from '../../../components/QRCodeModal';
import { useAuthStore } from '../../../store/authStore';
import { useAuth } from '../../../hooks/useAuth';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  color?: string;
}

function SettingsItem({ icon, label, onPress, showChevron = true, color }: SettingsItemProps) {
  return (
    <Pressable style={styles.settingsItem} onPress={onPress}>
      <View style={[styles.iconContainer, color ? { backgroundColor: color + '20' } : {}]}>
        <Ionicons name={icon} size={22} color={color || Colors.primary} />
      </View>
      <Text style={[styles.settingsLabel, color ? { color } : {}]}>{label}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuth();

  // Get user data from store
  const userId = user?.uid || 'unknown';
  const userName = user?.displayName || 'User';
  const userAbout = user?.about || t('auth.defaultAbout');
  const userAvatar = user?.avatarUrl || null;

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
        <Ionicons
          name="search-outline"
          size={24}
          color={Colors.textInverse}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <Pressable style={styles.profileSection} onPress={() => setQrModalVisible(true)}>
          <View style={styles.avatar}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={Colors.textSecondary} />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileAbout} numberOfLines={1}>{userAbout}</Text>
          </View>
          <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
        </Pressable>

        {/* Settings Sections */}
        <View style={styles.section}>
          <SettingsItem icon="person-outline" label={t('settings.account')} />
          <SettingsItem icon="lock-closed-outline" label={t('settings.privacy')} />
          <SettingsItem icon="shield-checkmark-outline" label={t('settings.security')} />
        </View>

        <View style={styles.section}>
          <SettingsItem icon="chatbubble-outline" label={t('settings.chatsSettings')} />
          <SettingsItem icon="notifications-outline" label={t('settings.notifications')} />
          <SettingsItem icon="server-outline" label={t('settings.storage')} />
        </View>

        <View style={styles.section}>
          <SettingsItem icon="language-outline" label={t('settings.language')} />
          <SettingsItem icon="help-circle-outline" label={t('settings.help')} />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon="log-out-outline"
            label={t('settings.logout')}
            color={Colors.error}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
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
    color: Colors.textPrimary,
  },
  profileAbout: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: Colors.background,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.divider,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.md,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  versionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  versionSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
