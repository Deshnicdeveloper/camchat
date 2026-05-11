/**
 * TypingIndicator Component
 * Animated three-dot bubble showing when someone is typing
 */

import { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants';

interface TypingIndicatorProps {
  size?: 'small' | 'medium';
}

export const TypingIndicator = memo(function TypingIndicator({
  size = 'medium',
}: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, 200);
    const animation3 = createAnimation(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotSize = size === 'small' ? 6 : 8;
  const containerPadding = size === 'small' ? Spacing.xs : Spacing.sm;

  const animatedStyle = (dot: Animated.Value) => ({
    transform: [
      {
        translateY: dot.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={[styles.container, { paddingVertical: containerPadding }]}>
      <Animated.View
        style={[
          styles.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          animatedStyle(dot1),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          animatedStyle(dot2),
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2 },
          animatedStyle(dot3),
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.messageReceived,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    alignSelf: 'flex-start',
    marginVertical: Spacing.xs,
  },
  dot: {
    backgroundColor: Colors.textSecondary,
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
