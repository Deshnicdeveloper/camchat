/**
 * Badge Component
 * Used for unread counts, status indicators, etc.
 */

import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'muted';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  count?: number;
  maxCount?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

export default function Badge({
  count,
  maxCount = 99,
  variant = 'primary',
  size = 'md',
  dot = false,
  style,
}: BadgeProps) {
  if (!dot && (count === undefined || count <= 0)) {
    return null;
  }

  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count;

  const getBadgeStyle = (): ViewStyle[] => {
    const styles_arr: ViewStyle[] = [styles.badge, styles[`badge_${size}`]];

    switch (variant) {
      case 'primary':
        styles_arr.push(styles.badgePrimary);
        break;
      case 'success':
        styles_arr.push(styles.badgeSuccess);
        break;
      case 'warning':
        styles_arr.push(styles.badgeWarning);
        break;
      case 'error':
        styles_arr.push(styles.badgeError);
        break;
      case 'muted':
        styles_arr.push(styles.badgeMuted);
        break;
    }

    if (dot) {
      styles_arr.push(styles[`dot_${size}`]);
    }

    if (style) {
      styles_arr.push(style);
    }

    return styles_arr;
  };

  const getTextStyle = (): TextStyle[] => {
    return [styles.text, styles[`text_${size}`]];
  };

  return (
    <View style={getBadgeStyle()}>
      {!dot && <Text style={getTextStyle()}>{displayCount}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 20,
  },

  // Size variants
  badge_sm: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
  },
  badge_md: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: Spacing.xs,
    borderRadius: 10,
  },
  badge_lg: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: Spacing.sm,
    borderRadius: 12,
  },

  // Dot variants
  dot_sm: {
    width: 8,
    height: 8,
    minWidth: 8,
    borderRadius: 4,
    paddingHorizontal: 0,
  },
  dot_md: {
    width: 10,
    height: 10,
    minWidth: 10,
    borderRadius: 5,
    paddingHorizontal: 0,
  },
  dot_lg: {
    width: 12,
    height: 12,
    minWidth: 12,
    borderRadius: 6,
    paddingHorizontal: 0,
  },

  // Color variants
  badgePrimary: {
    backgroundColor: Colors.primary,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  badgeWarning: {
    backgroundColor: Colors.warning,
  },
  badgeError: {
    backgroundColor: Colors.error,
  },
  badgeMuted: {
    backgroundColor: Colors.textSecondary,
  },

  // Text styles
  text: {
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textInverse,
  },
  text_sm: {
    fontSize: 10,
  },
  text_md: {
    fontSize: Typography.size.xs,
  },
  text_lg: {
    fontSize: Typography.size.sm,
  },
});
