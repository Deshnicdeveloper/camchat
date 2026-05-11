/**
 * VoiceCallView Component
 * Display for voice calls showing avatar and call info
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants';
import type { UserProfile } from '../../types';

const { width } = Dimensions.get('window');

interface VoiceCallViewProps {
  remoteUser: UserProfile | null;
  isConnected: boolean;
}

export function VoiceCallView({ remoteUser, isConnected }: VoiceCallViewProps) {
  // Animation for pulsing effect when connected
  const pulseOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    if (isConnected) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [isConnected, pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background rings animation */}
      {isConnected && (
        <>
          <Animated.View style={[styles.pulseRing, styles.pulseRing1, pulseStyle]} />
          <Animated.View style={[styles.pulseRing, styles.pulseRing2, pulseStyle]} />
          <Animated.View style={[styles.pulseRing, styles.pulseRing3, pulseStyle]} />
        </>
      )}

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {remoteUser?.avatarUrl ? (
          <Image
            source={{ uri: remoteUser.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={80} color={Colors.textSecondary} />
          </View>
        )}
      </View>

      {/* User Name */}
      <Text style={styles.userName}>{remoteUser?.displayName || 'Unknown'}</Text>

      {/* Connection indicator */}
      {isConnected && (
        <View style={styles.connectedIndicator}>
          <Ionicons name="radio" size={20} color={Colors.success} />
          <Text style={styles.connectedText}>Connected</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  pulseRing1: {
    width: 200,
    height: 200,
  },
  pulseRing2: {
    width: 280,
    height: 280,
  },
  pulseRing3: {
    width: 360,
    height: 360,
  },
  avatarContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xxl,
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 20,
  },
  connectedText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.success,
  },
});

export default VoiceCallView;
