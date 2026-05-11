/**
 * CallControls Component
 * Control buttons for voice and video calls
 */

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';

interface CallControlsProps {
  callType: 'voice' | 'video';
  isMuted: boolean;
  isSpeakerOn: boolean;
  isCameraOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleCamera: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
}

export function CallControls({
  callType,
  isMuted,
  isSpeakerOn,
  isCameraOn,
  onToggleMute,
  onToggleSpeaker,
  onToggleCamera,
  onSwitchCamera,
  onEndCall,
}: CallControlsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.controlsRow}>
        {/* Mute Button */}
        <Pressable
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={onToggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={28}
            color={isMuted ? Colors.error : Colors.textInverse}
          />
        </Pressable>

        {/* Speaker Button (voice calls) or Camera Toggle (video calls) */}
        {callType === 'voice' ? (
          <Pressable
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={onToggleSpeaker}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
              size={28}
              color={isSpeakerOn ? Colors.primary : Colors.textInverse}
            />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.controlButton, !isCameraOn && styles.controlButtonActive]}
            onPress={onToggleCamera}
          >
            <Ionicons
              name={isCameraOn ? 'videocam' : 'videocam-off'}
              size={28}
              color={!isCameraOn ? Colors.error : Colors.textInverse}
            />
          </Pressable>
        )}

        {/* End Call Button */}
        <Pressable
          style={[styles.controlButton, styles.endCallButton]}
          onPress={onEndCall}
        >
          <Ionicons
            name="call"
            size={32}
            color={Colors.textInverse}
            style={styles.endCallIcon}
          />
        </Pressable>

        {/* Switch Camera (video calls only) */}
        {callType === 'video' && (
          <Pressable style={styles.controlButton} onPress={onSwitchCamera}>
            <Ionicons name="camera-reverse" size={28} color={Colors.textInverse} />
          </Pressable>
        )}

        {/* Speaker (video calls) */}
        {callType === 'video' && (
          <Pressable
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={onToggleSpeaker}
          >
            <Ionicons
              name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
              size={28}
              color={isSpeakerOn ? Colors.primary : Colors.textInverse}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  endCallButton: {
    backgroundColor: Colors.error,
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
});

export default CallControls;
