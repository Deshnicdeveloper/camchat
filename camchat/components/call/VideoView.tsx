/**
 * VideoView Component
 * Renders Agora video streams for local and remote users
 */

import React from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { RtcSurfaceView, VideoSourceType, RenderModeType } from 'react-native-agora';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Radius, Spacing } from '../../constants';

const { width, height } = Dimensions.get('window');
const LOCAL_VIDEO_WIDTH = 120;
const LOCAL_VIDEO_HEIGHT = 160;
const PADDING = 20;

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
  // Local video position (draggable)
  const translateX = useSharedValue(width - LOCAL_VIDEO_WIDTH - PADDING);
  const translateY = useSharedValue(height - LOCAL_VIDEO_HEIGHT - PADDING - 200); // Account for controls

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
      // Snap to edges
      const finalX = translateX.value < width / 2 - LOCAL_VIDEO_WIDTH / 2
        ? PADDING
        : width - LOCAL_VIDEO_WIDTH - PADDING;

      // Clamp Y position
      const minY = PADDING + 100; // Account for header
      const maxY = height - LOCAL_VIDEO_HEIGHT - PADDING - 200; // Account for controls
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

  return (
    <View style={styles.container}>
      {/* Remote Video (Full Screen) */}
      {remoteUid !== undefined && remoteUid !== null ? (
        <RtcSurfaceView
          style={styles.remoteVideo}
          canvas={{
            uid: remoteUid,
            sourceType: VideoSourceType.VideoSourceRemote,
            renderMode: RenderModeType.RenderModeFit,
          }}
        />
      ) : (
        <View style={styles.noRemoteVideo}>
          {/* Placeholder for when remote user hasn't joined yet */}
        </View>
      )}

      {/* Local Video (Picture-in-Picture, Draggable) */}
      {isLocalVideoEnabled && (
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.localVideoContainer, localVideoStyle]}>
            <RtcSurfaceView
              style={styles.localVideo}
              canvas={{
                uid: localUid,
                sourceType: VideoSourceType.VideoSourceCamera,
                renderMode: RenderModeType.RenderModeHidden,
                mirrorMode: 1, // Mirror local video
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
});

export default VideoView;
