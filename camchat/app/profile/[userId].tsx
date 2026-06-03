import { useMemo } from 'react';
/**
 * User Profile Screen
 * View another user's profile
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';

export default function ProfileScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={60} color={colors.textSecondary} />
          </View>
          <Text style={styles.userName}>User Name</Text>
          <Text style={styles.phoneNumber}>+237 6XX XXX XXX</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <Text style={styles.aboutText}>Hey, I'm on CamChat</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubble" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Message</Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="call" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Audio</Text>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Ionicons name="videocam" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Video</Text>
          </Pressable>
        </View>

        {/* Media Section */}
        <Pressable style={styles.mediaSection}>
          <View style={styles.mediaSectionContent}>
            <Text style={styles.mediaSectionTitle}>Media, Links, and Docs</Text>
            <Text style={styles.mediaSectionCount}>0</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>

        {/* User ID (Debug) */}
        <Text style={styles.debugText}>User ID: {userId}</Text>
      </ScrollView>
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
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xl,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  phoneNumber: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: colors.textSecondary,
  },
  section: {
    padding: Spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  aboutText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.xl,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: colors.primary,
  },
  mediaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  mediaSectionContent: {
    flex: 1,
  },
  mediaSectionTitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
  },
  mediaSectionCount: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  debugText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
