/**
 * Reusable Button Component
 * Primary, secondary, and outline variants
 */

import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button, styles[`button_${size}`]];

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.buttonGhost);
        break;
    }

    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    if (isDisabled) {
      baseStyle.push(styles.buttonDisabled);
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.textPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.textSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      case 'ghost':
        baseStyle.push(styles.textGhost);
        break;
    }

    if (isDisabled) {
      baseStyle.push(styles.textDisabled);
    }

    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
  };

  const getLoaderColor = (): string => {
    switch (variant) {
      case 'primary':
        return Colors.primary;
      case 'secondary':
        return Colors.textInverse;
      case 'outline':
      case 'ghost':
        return Colors.primary;
      default:
        return Colors.primary;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        ...getButtonStyle(),
        pressed && !isDisabled && styles.buttonPressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getLoaderColor()} />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  fullWidth: {
    width: '100%',
  },

  // Size variants
  button_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  button_md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  button_lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },

  // Color variants
  buttonPrimary: {
    backgroundColor: Colors.textInverse,
  },
  buttonSecondary: {
    backgroundColor: Colors.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },

  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontFamily: Typography.fontFamily.semibold,
  },
  text_sm: {
    fontSize: Typography.size.sm,
  },
  text_md: {
    fontSize: Typography.size.md,
  },
  text_lg: {
    fontSize: Typography.size.lg,
  },

  textPrimary: {
    color: Colors.primary,
  },
  textSecondary: {
    color: Colors.textInverse,
  },
  textOutline: {
    color: Colors.primary,
  },
  textGhost: {
    color: Colors.primary,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
