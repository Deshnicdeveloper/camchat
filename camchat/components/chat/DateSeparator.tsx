import { useMemo } from 'react';
/**
 * DateSeparator Component
 * Shows date divider between messages from different days
 */

import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, Radius, ColorPalette } from '../../constants';
import { useColors } from '../../hooks/useColors';
import { formatDateSeparator } from '../../utils/formatTime';

interface DateSeparatorProps {
  date: Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.chip}>
        <Text style={styles.text}>{formatDateSeparator(date)}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  chip: {
    backgroundColor: colors.primaryFaded,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  text: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: colors.primary,
    textTransform: 'uppercase',
  },
});
