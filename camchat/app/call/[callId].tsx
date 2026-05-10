/**
 * Call Screen
 * Full-screen voice/video call interface
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';

export default function CallScreen() {
  const { callId } = useLocalSearchParams<{ callId: string }>();

  const handleEndCall = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Caller Info */}
      <View style={styles.callerInfo}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={80} color={Colors.textSecondary} />
        </View>
        <Text style={styles.callerName}>Contact Name</Text>
        <Text style={styles.callStatus}>Calling...</Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <Pressable style={styles.controlButton}>
          <Ionicons name="volume-high" size={28} color={Colors.textInverse} />
        </Pressable>
        <Pressable style={styles.controlButton}>
          <Ionicons name="videocam-off" size={28} color={Colors.textInverse} />
        </Pressable>
        <Pressable style={styles.controlButton}>
          <Ionicons name="mic-off" size={28} color={Colors.textInverse} />
        </Pressable>
        <Pressable style={[styles.controlButton, styles.endCallButton]} onPress={handleEndCall}>
          <Ionicons name="call" size={28} color={Colors.textInverse} style={{ transform: [{ rotate: '135deg' }] }} />
        </Pressable>
      </View>

      <Text style={styles.callId}>Call ID: {callId}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  callerName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xxl,
    color: Colors.textInverse,
    marginBottom: Spacing.sm,
  },
  callStatus: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: Colors.error,
  },
  callId: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.xs,
    color: Colors.textInverse,
    opacity: 0.5,
  },
});
