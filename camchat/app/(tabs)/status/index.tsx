/**
 * Status Screen
 * Displays user statuses/stories
 */

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { t } from '../../../lib/i18n';

export default function StatusScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('status.title')}</Text>
        <View style={styles.headerActions}>
          <Ionicons
            name="search-outline"
            size={24}
            color={Colors.textInverse}
            style={styles.headerIcon}
          />
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={Colors.textInverse}
          />
        </View>
      </View>

      <View style={styles.content}>
        {/* My Status */}
        <View style={styles.myStatus}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.textSecondary} />
            </View>
            <View style={styles.addIcon}>
              <Ionicons name="add" size={16} color={Colors.textInverse} />
            </View>
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.myStatusTitle}>{t('status.myStatus')}</Text>
            <Text style={styles.myStatusSubtitle}>{t('status.addStatus')}</Text>
          </View>
        </View>

        {/* Recent Updates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('status.recentUpdates')}</Text>
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <Ionicons
            name="radio-outline"
            size={80}
            color={Colors.primary}
          />
          <Text style={styles.emptyText}>{t('status.noStatus')}</Text>
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: Spacing.lg,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  myStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  statusInfo: {
    marginLeft: Spacing.md,
  },
  myStatusTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  myStatusSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
