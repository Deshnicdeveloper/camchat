/**
 * Reusable Avatar Component
 * Displays user profile picture with fallback to initials
 */

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing } from '../../constants';
import { getInitials } from '../../utils/getInitials';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
  xxl: 120,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: Typography.size.xs,
  sm: Typography.size.sm,
  md: Typography.size.base,
  lg: Typography.size.lg,
  xl: Typography.size.xl,
  xxl: Typography.size.xxl,
};

const onlineIndicatorSizeMap: Record<AvatarSize, number> = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
};

export default function Avatar({
  uri,
  name = '',
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const dimensions = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const onlineSize = onlineIndicatorSizeMap[size];
  const initials = getInitials(name);

  const containerStyle: ViewStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: dimensions / 2,
  };

  return (
    <View style={[styles.container, containerStyle, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, containerStyle]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.placeholder, containerStyle]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {showOnlineStatus && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
              borderWidth: onlineSize > 12 ? 3 : 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: Colors.surfaceAlt,
  },
  placeholder: {
    backgroundColor: Colors.primaryFaded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.success,
    borderColor: Colors.background,
  },
});
