/**
 * Divider Component
 * Horizontal or vertical separator line
 */

import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../../constants';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  color?: string;
  thickness?: number;
  style?: ViewStyle;
}

export default function Divider({
  orientation = 'horizontal',
  spacing = 'none',
  color = Colors.divider,
  thickness = 1,
  style,
}: DividerProps) {
  const isHorizontal = orientation === 'horizontal';

  const getSpacing = (): number => {
    switch (spacing) {
      case 'sm':
        return Spacing.sm;
      case 'md':
        return Spacing.md;
      case 'lg':
        return Spacing.lg;
      default:
        return 0;
    }
  };

  const spacingValue = getSpacing();

  const dividerStyle: ViewStyle = isHorizontal
    ? {
        height: thickness,
        width: '100%',
        marginVertical: spacingValue,
      }
    : {
        width: thickness,
        height: '100%',
        marginHorizontal: spacingValue,
      };

  return (
    <View
      style={[
        styles.divider,
        { backgroundColor: color },
        dividerStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    alignSelf: 'stretch',
  },
});
