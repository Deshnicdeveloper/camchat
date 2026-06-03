/**
 * Settings UI Kit
 * Reusable building blocks for settings sub-screens so every screen shares the
 * same header, grouped cards, rows and toggles.
 */

import { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants';

interface ScaffoldProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Full screen scaffold with a branded header + scrollable body. */
export function SettingsScaffold({ title, subtitle, children }: ScaffoldProps) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

interface GroupProps {
  title?: string;
  footer?: string;
  children: ReactNode;
}

/** A titled group of rows rendered as a single card. */
export function SettingsGroup({ title, footer, children }: GroupProps) {
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.card}>{children}</View>
      {footer ? <Text style={styles.groupFooter}>{footer}</Text> : null}
    </View>
  );
}

interface RowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  color?: string;
  rightElement?: ReactNode;
}

/** A tappable row with optional icon, value text and chevron. */
export function SettingsRow({
  icon,
  label,
  description,
  value,
  onPress,
  showChevron = true,
  color,
  rightElement,
}: RowProps) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      {icon ? (
        <View style={[styles.iconContainer, color ? { backgroundColor: color + '20' } : null]}>
          <Ionicons name={icon} size={20} color={color || Colors.primary} />
        </View>
      ) : null}
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowLabel, color ? { color } : null]}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {rightElement}
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

interface ToggleProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/** A row with a trailing Switch. */
export function SettingsToggle({
  icon,
  label,
  description,
  value,
  onValueChange,
}: ToggleProps) {
  return (
    <View style={styles.row}>
      {icon ? (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
      ) : null}
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.surfaceAlt, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : '#FFFFFF'}
        ios_backgroundColor={Colors.surfaceAlt}
      />
    </View>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    opacity: 0.85,
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  bodyContent: {
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  group: {
    marginBottom: Spacing.xl,
  },
  groupTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xl,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  groupFooter: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.background,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  rowDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
});
