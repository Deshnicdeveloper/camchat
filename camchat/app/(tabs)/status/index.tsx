/**
 * Status Screen
 * Displays user statuses/stories with WhatsApp-style UI
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Typography, Spacing, Radius, ColorPalette } from '../../../constants';
import { useColors } from '../../../hooks/useColors';
import { t } from '../../../lib/i18n';
import { useStatus } from '../../../hooks/useStatus';
import { useAuthStore } from '../../../store/authStore';
import { StatusRing, StatusRow } from '../../../components/status';
import { formatStatusTime } from '../../../utils/formatTime';
import type { StatusGroup } from '../../../types';

export default function StatusScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    myStatuses,
    contactStatuses,
    isLoading,
    refreshStatuses,
  } = useStatus();

  // Check if user has any active statuses
  const hasMyStatus = myStatuses.length > 0;
  const latestMyStatus = hasMyStatus ? myStatuses[0] : null;

  // Handle camera button press (media status)
  const handleCameraPress = useCallback(() => {
    router.push('/status/create?type=media');
  }, [router]);

  // Handle pen button press (text status)
  const handleTextPress = useCallback(() => {
    router.push('/status/create?type=text');
  }, [router]);

  // Handle my status press (view own statuses)
  const handleMyStatusPress = useCallback(() => {
    if (hasMyStatus && user?.uid) {
      router.push(`/status/view/${user.uid}`);
    } else {
      // No status, open media picker
      handleCameraPress();
    }
  }, [hasMyStatus, user?.uid, router, handleCameraPress]);

  // Handle contact status press
  const handleContactStatusPress = useCallback(
    (statusGroup: StatusGroup) => {
      router.push(`/status/view/${statusGroup.userId}`);
    },
    [router]
  );

  // Render my status row
  const renderMyStatus = useCallback(() => {
    return (
      <Pressable style={styles.myStatusRow} onPress={handleMyStatusPress}>
        <View style={styles.myStatusAvatar}>
          {latestMyStatus?.type === 'text' ? (
            // Show text status preview with background
            <View
              style={[
                styles.textStatusPreview,
                { backgroundColor: latestMyStatus.backgroundColor || colors.primary },
              ]}
            >
              <Text style={styles.textStatusText} numberOfLines={2}>
                {latestMyStatus.text}
              </Text>
            </View>
          ) : latestMyStatus?.mediaUrl ? (
            // Show image/video preview
            <StatusRing
              avatarUrl={latestMyStatus.mediaUrl}
              size="lg"
              hasUnviewed={false}
              statusCount={myStatuses.length}
            />
          ) : user?.avatarUrl ? (
            // Show user avatar with add button
            <StatusRing
              avatarUrl={user.avatarUrl}
              size="lg"
              showAddButton={!hasMyStatus}
              statusCount={myStatuses.length}
              hasUnviewed={hasMyStatus}
            />
          ) : (
            // Show placeholder with add button
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={colors.textSecondary} />
              {!hasMyStatus && (
                <View style={styles.addBadge}>
                  <Ionicons name="add" size={14} color={colors.textInverse} />
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.myStatusInfo}>
          <Text style={styles.myStatusTitle}>{t('status.myStatus')}</Text>
          <Text style={styles.myStatusSubtitle}>
            {hasMyStatus
              ? formatStatusTime(latestMyStatus!.createdAt)
              : t('status.addStatus')}
          </Text>
        </View>

        {/* View count for own statuses */}
        {hasMyStatus && (
          <View style={styles.viewCount}>
            <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.viewCountText}>
              {latestMyStatus?.viewedBy.length || 0}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }, [
    myStatuses,
    hasMyStatus,
    latestMyStatus,
    user,
    handleMyStatusPress,
  ]);

  // Render contact status row
  const renderContactStatus = useCallback(
    ({ item }: { item: StatusGroup }) => (
      <StatusRow
        statusGroup={item}
        onPress={() => handleContactStatusPress(item)}
      />
    ),
    [handleContactStatusPress]
  );

  // List header (my status + section header)
  const ListHeader = useMemo(
    () => (
      <>
        {/* My Status */}
        {renderMyStatus()}

        {/* Recent Updates Section */}
        {contactStatuses.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('status.recentUpdates')}</Text>
          </View>
        )}
      </>
    ),
    [renderMyStatus, contactStatuses.length]
  );

  // Empty state component
  const EmptyComponent = useMemo(
    () =>
      !isLoading && contactStatuses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="radio-outline" size={64} color={colors.primaryFaded} />
          <Text style={styles.emptyText}>{t('status.noStatus')}</Text>
        </View>
      ) : null,
    [isLoading, contactStatuses.length]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('status.title')}</Text>
        <View style={styles.headerActions}>
          {/* Camera button (media status) */}
          <Pressable onPress={handleCameraPress} style={styles.headerButton}>
            <Ionicons name="camera-outline" size={24} color={colors.textInverse} />
          </Pressable>
          {/* Pen button (text status) */}
          <Pressable onPress={handleTextPress} style={styles.headerButton}>
            <Ionicons name="pencil-outline" size={22} color={colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading && contactStatuses.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={contactStatuses}
            renderItem={renderContactStatus}
            keyExtractor={(item) => item.userId}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={EmptyComponent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refreshStatuses}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // My Status
  myStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  myStatusAvatar: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  textStatusPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xs,
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  textStatusText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: colors.textInverse,
    textAlign: 'center',
  },
  myStatusInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  myStatusTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
  },
  myStatusSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
