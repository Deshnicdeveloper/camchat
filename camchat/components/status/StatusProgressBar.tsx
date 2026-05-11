/**
 * StatusProgressBar Component
 * Multi-segment progress bar for story viewer
 */

import { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing } from '../../constants';

interface StatusProgressBarProps {
  count: number;
  currentIndex: number;
  duration: number; // Duration per status in milliseconds
  isPaused: boolean;
  onComplete: () => void;
}

function StatusProgressBar({
  count,
  currentIndex,
  duration,
  isPaused,
  onComplete,
}: StatusProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset progress when index changes
    progressAnim.setValue(0);

    if (!isPaused) {
      // Start animation
      animationRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      });

      animationRef.current.start(({ finished }) => {
        if (finished) {
          onComplete();
        }
      });
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [currentIndex, duration, isPaused, onComplete, progressAnim]);

  useEffect(() => {
    if (isPaused) {
      // Pause animation
      if (animationRef.current) {
        animationRef.current.stop();
      }
    } else {
      // Resume animation
      animationRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration * (1 - (progressAnim as unknown as { _value: number })._value),
        useNativeDriver: false,
      });

      animationRef.current.start(({ finished }) => {
        if (finished) {
          onComplete();
        }
      });
    }
  }, [isPaused, duration, onComplete, progressAnim]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.segmentContainer}>
          <View style={styles.segmentBackground} />
          {index < currentIndex ? (
            // Completed segment
            <View style={[styles.segmentFill, { width: '100%' }]} />
          ) : index === currentIndex ? (
            // Current segment (animated)
            <Animated.View
              style={[
                styles.segmentFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    gap: 4,
  },
  segmentContainer: {
    flex: 1,
    height: 2,
    position: 'relative',
  },
  segmentBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  segmentFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: Colors.background,
    borderRadius: 1,
  },
});

export default memo(StatusProgressBar);
