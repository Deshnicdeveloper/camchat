/**
 * StatusRow Component
 * Displays a contact's status preview in the status list
 */

import { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Typography, Spacing, ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { formatStatusTime } from '../../utils/formatTime';
import StatusRing from './StatusRing';
import type { StatusGroup } from '../../types';

interface StatusRowProps {
  statusGroup: StatusGroup;
  onPress: () => void;
}

function StatusRow({ statusGroup, onPress }: StatusRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, statuses, hasUnviewed } = statusGroup;
  const latestStatus = statuses[0];
  const statusCount = statuses.length;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <StatusRing
        avatarUrl={user.avatarUrl}
        name={user.displayName}
        size="md"
        hasUnviewed={hasUnviewed}
        statusCount={statusCount}
      />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={styles.time}>
          {formatStatusTime(latestStatus.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.background,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  time: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
  },
});

export default memo(StatusRow);
