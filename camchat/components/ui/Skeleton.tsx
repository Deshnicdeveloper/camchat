/**
 * Skeleton Loading Component
 * Animated placeholder while content loads
 */

import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Easing } from 'react-native';
import { Colors, Radius } from '../../constants';

type SkeletonVariant = 'text' | 'circular' | 'rectangular';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  variant?: SkeletonVariant;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({
  width = '100%',
  height = 16,
  variant = 'text',
  borderRadius,
  style,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const getBorderRadius = (): number => {
    if (borderRadius !== undefined) {
      return borderRadius;
    }

    switch (variant) {
      case 'circular':
        return typeof height === 'number' ? height / 2 : 50;
      case 'text':
        return Radius.sm;
      case 'rectangular':
        return Radius.md;
      default:
        return Radius.sm;
    }
  };

  const getSize = (): ViewStyle => {
    if (variant === 'circular') {
      const size = height;
      return {
        width: size,
        height: size,
      };
    }

    return {
      width: typeof width === 'number' ? width : undefined,
      height,
    };
  };

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        getSize(),
        { borderRadius: getBorderRadius(), opacity },
        typeof width === 'string' && { width },
        style,
      ]}
    />
  );
}

// Pre-built skeleton components for common use cases
export function SkeletonAvatar({ size = 48 }: { size?: number }) {
  return <Skeleton variant="circular" height={size} />;
}

export function SkeletonText({
  lines = 1,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lastLineWidth?: number | string;
}) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={14}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={index > 0 ? styles.textLine : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonChatRow() {
  return (
    <View style={styles.chatRow}>
      <SkeletonAvatar size={48} />
      <View style={styles.chatRowContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={14} style={styles.chatRowSubtitle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surfaceAlt,
  },
  textContainer: {
    width: '100%',
  },
  textLine: {
    marginTop: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chatRowContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatRowSubtitle: {
    marginTop: 6,
  },
});
