/**
 * VideoView Component
 * Renders Agora video streams for local and remote users
 * Falls back to placeholder when Agora is not available (Expo Go)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Constants from 'expo-constants';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '../../constants';

const { width, height } = Dimensions.get('window');
const LOCAL_VIDEO_WIDTH = 120;
const LOCAL_VIDEO_HEIGHT = 160;
const PADDING = 20;

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamically loaded Agora components
let RtcSurfaceView: React.ComponentType<unknown> | null = null;
let VideoSourceType: Record<string, number> | null = null;
let RenderModeType: Record<string, number> | null = null;

interface VideoViewProps {
  localUid?: number;
  remoteUid?: number;
  channelId: string;
  isLocalVideoEnabled: boolean;
}

export function VideoView({
  localUid = 0,
  remoteUid,
  channelId,
  isLocalVideoEnabled,
}: VideoViewProps) {
  const [agoraLoaded, setAgoraLoaded] = useState(false);

  // Load Agora module dynamically
  useEffect(() => {
    if (!isExpoGo) {
      import('react-native-agora')
        .then((module) => {
          RtcSurfaceView = module.RtcSurfaceView;
          VideoSourceType = module.VideoSourceType;
          RenderModeType = module.RenderModeType;
          setAgoraLoaded(true);
        })
        .catch((error) => {
          console.warn('Failed to load Agora:', error);
        });
    }
  }, []);

  // Local video position (draggable)
  const translateX = useSharedValue(width - LOCAL_VIDEO_WIDTH - PADDING);
  const translateY = useSharedValue(height - LOCAL_VIDEO_HEIGHT - PADDING - 200);

  // Context for gesture
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      const finalX = translateX.value < width / 2 - LOCAL_VIDEO_WIDTH / 2
        ? PADDING
        : width - LOCAL_VIDEO_WIDTH - PADDING;

      const minY = PADDING + 100;
      const maxY = height - LOCAL_VIDEO_HEIGHT - PADDING - 200;
      const clampedY = Math.max(minY, Math.min(maxY, translateY.value));

      translateX.value = withSpring(finalX);
      translateY.value = withSpring(clampedY);
    });

  const localVideoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Fallback UI when Agora is not available
  if (!agoraLoaded || isExpoGo) {
    return (
      <View style={styles.container}>
        <View style={styles.fallbackContainer}>
          <Ionicons name="videocam-off" size={60} color={Colors.textInverse} />
          <Text style={styles.fallbackText}>
            Video calls require a development build
          </Text>
          <Text style={styles.fallbackSubtext}>
            Expo Go does not support native video modules
          </Text>
        </View>
      </View>
    );
  }

  // Render Agora video views
  const AgoraRtcSurfaceView = RtcSurfaceView as React.ComponentType<{
    style: object;
    canvas: object;
    zOrderMediaOverlay?: boolean;
  }>;

  return (
    <View style={styles.container}>
      {/* Remote Video (Full Screen) */}
      {remoteUid !== undefined && remoteUid !== null && VideoSourceType && RenderModeType ? (
        <AgoraRtcSurfaceView
          style={styles.remoteVideo}
          canvas={{
            uid: remoteUid,
            sourceType: VideoSourceType.VideoSourceRemote,
            renderMode: RenderModeType.RenderModeFit,
          }}
        />
      ) : (
        <View style={styles.noRemoteVideo}>
          <Ionicons name="person" size={80} color={Colors.textSecondary} />
          <Text style={styles.waitingText}>Waiting for video...</Text>
        </View>
      )}

      {/* Local Video (Picture-in-Picture, Draggable) */}
      {isLocalVideoEnabled && VideoSourceType && RenderModeType && (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.localVideoContainer, localVideoStyle]}>
            <AgoraRtcSurfaceView
              style={styles.localVideo}
              canvas={{
                uid: localUid,
                sourceType: VideoSourceType.VideoSourceCamera,
                renderMode: RenderModeType.RenderModeHidden,
                mirrorMode: 1,
              }}
              zOrderMediaOverlay={true}
            />
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  remoteVideo: {
    flex: 1,
  },
  noRemoteVideo: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    marginTop: Spacing.md,
    opacity: 0.7,
  },
  localVideoContainer: {
    position: 'absolute',
    width: LOCAL_VIDEO_WIDTH,
    height: LOCAL_VIDEO_HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.textInverse,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  localVideo: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  fallbackText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  fallbackSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    textAlign: 'center',
    marginTop: Spacing.sm,
    opacity: 0.7,
  },
});

export default VideoView;
