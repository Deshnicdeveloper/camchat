/**
 * ContactRow Component
 * Individual contact item for new chat selection
 */

import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Avatar } from '../ui';
import { Colors, Typography, Spacing } from '../../constants';
import { User } from '../../types';

interface ContactRowProps {
  contact: User;
  onPress: () => void;
}

function ContactRow({ contact, onPress }: ContactRowProps) {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  about: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
});

export default memo(ContactRow);
