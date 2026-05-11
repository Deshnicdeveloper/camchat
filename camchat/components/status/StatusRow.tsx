/**
 * StatusRow Component
 * Displays a contact's status preview in the status list
 */

import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';
import { formatStatusTime } from '../../utils/formatTime';
import StatusRing from './StatusRing';
import type { StatusGroup } from '../../types';

interface StatusRowProps {
  statusGroup: StatusGroup;
  onPress: () => void;
}

function StatusRow({ statusGroup, onPress }: StatusRowProps) {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  time: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
});

export default memo(StatusRow);
