/**
 * IncomingCallOverlay Component
 * Full-screen overlay for incoming calls
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
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
import { t } from '../../lib/i18n';
import type { CallType, UserProfile } from '../../types';

const { height } = Dimensions.get('window');

interface IncomingCallOverlayProps {
  caller: UserProfile;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallOverlay({
  caller,
  callType,
  onAccept,
  onDecline,
}: IncomingCallOverlayProps) {
  // Animation for pulsing avatar ring
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.overlayContainer}>
        {/* Caller Info */}
        <View style={styles.callerInfo}>
          <Animated.View style={[styles.avatarRing, pulseStyle]}>
            <View style={styles.avatarContainer}>
              {caller.avatarUrl ? (
                <Image
                  source={{ uri: caller.avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={60} color={Colors.textSecondary} />
                </View>
              )}
            </View>
          </Animated.View>

          <Text style={styles.callerName}>{caller.displayName}</Text>
          <Text style={styles.callType}>
            {callType === 'video' ? t('calls.videoCall') : t('calls.voiceCall')}
          </Text>
        </View>

        {/* Call Actions */}
        <View style={styles.actions}>
          {/* Decline Button */}
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.declineButton]}
              onPress={onDecline}
            >
              <Ionicons
                name="call"
                size={32}
                color={Colors.textInverse}
                style={styles.declineIcon}
              />
            </Pressable>
            <Text style={styles.actionLabel}>{t('calls.decline')}</Text>
          </View>

          {/* Accept Button */}
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Ionicons
                name={callType === 'video' ? 'videocam' : 'call'}
                size={32}
                color={Colors.textInverse}
              />
            </Pressable>
            <Text style={styles.actionLabel}>{t('calls.accept')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    backgroundColor: 'rgba(10, 32, 112, 0.95)', // Dark primary color with opacity
  },
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  avatarRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
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
  callerName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xxl,
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  callType: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxxl * 2,
    paddingBottom: Spacing.xl,
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  declineButton: {
    backgroundColor: Colors.error,
  },
  acceptButton: {
    backgroundColor: Colors.success,
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
  },
  actionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },
});

export default IncomingCallOverlay;
