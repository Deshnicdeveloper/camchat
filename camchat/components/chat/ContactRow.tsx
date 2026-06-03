/**
 * ContactRow Component
 * Individual contact item for new chat selection
 */

import { memo, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Avatar } from '../ui';
import { Typography, Spacing, ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { User } from '../../types';

interface ContactRowProps {
  contact: User;
  onPress: () => void;
}

function ContactRow({ contact, onPress }: ContactRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable style={styles.container} onPress={onPress}>
      {/* Avatar */}
      <Avatar
        uri={contact.avatarUrl}
        name={contact.displayName}
        size="md"
        showOnlineStatus
        isOnline={contact.isOnline}
      />

      {/* Contact Info */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {contact.displayName}
        </Text>
        <Text style={styles.about} numberOfLines={1}>
          {contact.about}
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
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  about: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: colors.textSecondary,
  },
});

export default memo(ContactRow);
