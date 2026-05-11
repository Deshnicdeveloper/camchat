/**
 * Call Screen
 * Full-screen voice/video call interface with Agora integration
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, BackHandler, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing } from '../../constants';
import { t } from '../../lib/i18n';
import { getCallById } from '../../lib/calls';
import {
  acceptIncomingCall,
  declineIncomingCall,
  endActiveCall,
} from '../../lib/callSignaling';
import { getUserProfile } from '../../lib/contacts';
import { useCall } from '../../hooks/useCall';
import { useCallStore } from '../../store/callStore';
import {
  CallControls,
  CallStatus,
  VideoView,
  VoiceCallView,
  IncomingCallOverlay,
} from '../../components/call';

export default function CallScreen() {
  const { callId, isIncoming } = useLocalSearchParams<{
    callId: string;
    isIncoming?: string;
  }>();

  const isIncomingCall = isIncoming === 'true';

  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [showIncomingOverlay, setShowIncomingOverlay] = useState(isIncomingCall);

  // Zustand store
  const {
    activeCall,
    remoteUser,
    isMuted,
    isSpeakerOn,
    isCameraOn,
    callDuration,
    setActiveCall,
    setRemoteUser,
  } = useCallStore();

  // useCall hook for Agora
  const {
    isConnecting,
    isConnected,
    remoteUid,
    networkQuality,
    joinCall,
    leaveCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    switchCamera,
  } = useCall({
    onCallEnded: () => {
      console.log('📞 Call ended callback');
      if (router.canGoBack()) {
        router.back();
      }
    },
    onRemoteUserJoined: (uid) => {
      console.log('👤 Remote user joined:', uid);
    },
    onRemoteUserLeft: (uid) => {
      console.log('👤 Remote user left:', uid);
    },
    onError: (error) => {
      console.error('❌ Call error:', error);
    },
  });

  // Load call data
  useEffect(() => {
    const loadCallData = async () => {
      if (!callId) {
        console.error('No call ID provided');
        router.back();
        return;
      }

      try {
        setIsLoading(true);

        // Get call from Firestore
        const result = await getCallById(callId);
        if (!result.success || !result.call) {
          console.error('Call not found:', callId);
          router.back();
          return;
        }

        const call = result.call;
        setActiveCall(call);

        // Get remote user profile
        const remoteUserId = isIncomingCall ? call.callerId : call.receiverId;
        const profile = await getUserProfile(remoteUserId);
        if (profile) {
          setRemoteUser(profile);
        }

        // If incoming call, show overlay
        if (isIncomingCall && call.status === 'ringing') {
          setShowIncomingOverlay(true);
        } else if (call.status === 'ongoing') {
          // Call already ongoing, join directly
          await joinCall(call);
        }
      } catch (error) {
        console.error('Error loading call:', error);
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadCallData();
  }, [callId, isIncomingCall, setActiveCall, setRemoteUser, joinCall]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back during active call - must end call first
      if (activeCall?.status === 'ongoing') {
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [activeCall?.status]);

  // Handle accept incoming call
  const handleAcceptCall = useCallback(async () => {
    if (!activeCall) return;

    setShowIncomingOverlay(false);

    const accepted = await acceptIncomingCall(activeCall.id);
    if (accepted) {
      await joinCall(activeCall);
    }
  }, [activeCall, joinCall]);

  // Handle decline incoming call
  const handleDeclineCall = useCallback(async () => {
    if (!activeCall) return;

    await declineIncomingCall(activeCall.id);
    setShowIncomingOverlay(false);

    if (router.canGoBack()) {
      router.back();
    }
  }, [activeCall]);

  // Handle end call
  const handleEndCall = useCallback(async () => {
    if (activeCall) {
      await endActiveCall(activeCall.id);
    }
    await leaveCall();

    if (router.canGoBack()) {
      router.back();
    }
  }, [activeCall, leaveCall]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Incoming call overlay
  if (showIncomingOverlay && remoteUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" />
        <IncomingCallOverlay
          caller={remoteUser}
          callType={activeCall?.type || 'voice'}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      </SafeAreaView>
    );
  }

  // Video call view
  if (activeCall?.type === 'video') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Video streams */}
        <VideoView
          remoteUid={remoteUid ?? undefined}
          channelId={activeCall.agoraChannelName || ''}
          isLocalVideoEnabled={isCameraOn}
        />

        {/* Header overlay */}
        <SafeAreaView style={styles.videoHeaderOverlay} edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              {remoteUser?.avatarUrl ? (
                <Image
                  source={{ uri: remoteUser.avatarUrl }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                  <Ionicons name="person" size={16} color={Colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={styles.headerName}>{remoteUser?.displayName || 'Unknown'}</Text>
                <CallStatus
                  status={activeCall.status}
                  duration={callDuration}
                  networkQuality={networkQuality}
                  isConnecting={isConnecting}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>

        {/* Controls overlay */}
        <SafeAreaView style={styles.videoControlsOverlay} edges={['bottom']}>
          <CallControls
            callType="video"
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            isCameraOn={isCameraOn}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onToggleCamera={toggleCamera}
            onSwitchCamera={switchCamera}
            onEndCall={handleEndCall}
          />
        </SafeAreaView>
      </View>
    );
  }

  // Voice call view (default)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.voiceHeader}>
        <CallStatus
          status={activeCall?.status || 'ringing'}
          duration={callDuration}
          networkQuality={networkQuality}
          isConnecting={isConnecting}
        />
      </View>

      {/* Voice call display */}
      <VoiceCallView remoteUser={remoteUser} isConnected={isConnected} />

      {/* Controls */}
      <CallControls
        callType="voice"
        isMuted={isMuted}
        isSpeakerOn={isSpeakerOn}
        isCameraOn={false}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onToggleCamera={() => {}}
        onSwitchCamera={() => {}}
        onEndCall={handleEndCall}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  voiceHeader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  videoHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    marginBottom: 2,
  },
  videoControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
