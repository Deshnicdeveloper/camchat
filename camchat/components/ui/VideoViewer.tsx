/**
 * VideoViewer Component
 * Full-screen video player with controls
 */

import { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Typography, Spacing } from '../../constants';
import { t } from '../../lib/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoViewerProps {
  videoUrl: string;
  onClose: () => void;
}

export const VideoViewer = memo(function VideoViewer({
  videoUrl,
  onClose,
}: VideoViewerProps) {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
    } else if (status.error) {
      console.error('Video playback error:', status.error);
      setError('Failed to play video');
      setIsLoading(false);
    }
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    console.error('Video error:', errorMessage);
    setError('Failed to load video');
    setIsLoading(false);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  }, [isPlaying]);

  const handleDownload = useCallback(async () => {
    try {
      setIsDownloading(true);

      // Request permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('images.permissionRequired'));
        setIsDownloading(false);
        return;
      }

      // Generate filename
      const filename = `CamChat_${Date.now()}.mp4`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Download file
      const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert('', t('images.savedToGallery'));
    } catch (error) {
      console.error('Error downloading video:', error);
      Alert.alert(t('common.error'), t('images.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  }, [videoUrl]);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={Colors.textInverse} />
          </Pressable>

          <View style={styles.headerSpacer} />

          <Pressable
            onPress={handleDownload}
            style={styles.headerButton}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Ionicons name="download-outline" size={26} color={Colors.textInverse} />
            )}
          </Pressable>
        </View>

        {/* Video */}
        <View style={styles.videoContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.textInverse} />
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={togglePlayPause} style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onLoad={handleLoad}
                onError={(error) => handleError(error)}
              />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + 20, // Account for status bar
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  closeButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  closeButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
});

export default VideoViewer;
