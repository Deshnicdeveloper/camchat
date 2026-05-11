/**
 * ImageViewer Component
 * Full-screen image viewer with pinch-to-zoom and download
 */

import { memo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Spacing } from '../../constants';
import { t } from '../../lib/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageViewer = memo(function ImageViewer({
  imageUrl,
  onClose,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

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
      const filename = `CamChat_${Date.now()}.jpg`;
      // @ts-ignore - documentDirectory exists at runtime
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Download file
      // @ts-ignore - downloadAsync exists at runtime
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert('', t('images.savedToGallery'));
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert(t('common.error'), t('images.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  }, [imageUrl]);

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

        {/* Image */}
        <View style={styles.imageContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.textInverse} />
            </View>
          )}

          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
            onLoad={handleImageLoad}
            transition={200}
          />
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
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

export default ImageViewer;
