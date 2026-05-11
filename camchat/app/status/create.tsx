/**
 * Status Creation Screen
 * Create text or media statuses
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';
import { useStatus } from '../../hooks/useStatus';

// Preset background colors for text statuses (Cameroonian-inspired palette)
const BACKGROUND_COLORS = [
  '#1034A6', // Egyptian Blue (Primary)
  '#007A5E', // Cameroon Green
  '#CE1126', // Cameroon Red
  '#FCD116', // Cameroon Yellow
  '#0A2070', // Primary Dark
  '#3D5FC4', // Primary Light
  '#22C55E', // Success Green
  '#F59E0B', // Warning Orange
  '#EF4444', // Error Red
  '#6B7280', // Gray
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export default function StatusCreateScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'text' | 'media' }>();
  const { createTextStatus, createImageStatus, createVideoStatus } = useStatus();

  const [mode, setMode] = useState<'text' | 'media'>(type === 'text' ? 'text' : 'media');
  const [text, setText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine text color based on background brightness
  const getTextColor = (bgColor: string): string => {
    // Simple brightness check (could be improved with proper luminance calculation)
    const lightColors = ['#FCD116', '#F59E0B'];
    return lightColors.includes(bgColor) ? Colors.textPrimary : Colors.textInverse;
  };

  // Handle media selection
  const handleSelectMedia = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            t('common.permissionRequired'),
            'Camera permission is required to take photos.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
          allowsEditing: true,
          aspect: [9, 16],
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            t('common.permissionRequired'),
            'Gallery permission is required to select photos.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
          allowsEditing: true,
          aspect: [9, 16],
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'image');
        setMode('media');
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      Alert.alert(t('common.error'), 'Failed to select media');
    }
  }, []);

  // Handle post status
  const handlePost = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      let success = false;

      if (mode === 'text') {
        if (!text.trim()) {
          Alert.alert(t('common.error'), 'Please enter some text');
          setIsSubmitting(false);
          return;
        }
        success = await createTextStatus(text.trim(), backgroundColor);
      } else {
        if (!mediaUri) {
          Alert.alert(t('common.error'), 'Please select an image or video');
          setIsSubmitting(false);
          return;
        }
        if (mediaType === 'video') {
          success = await createVideoStatus(mediaUri, caption.trim() || undefined);
        } else {
          success = await createImageStatus(mediaUri, caption.trim() || undefined);
        }
      }

      if (success) {
        router.back();
      } else {
        Alert.alert(t('common.error'), 'Failed to create status');
      }
    } catch (error) {
      console.error('Error creating status:', error);
      Alert.alert(t('common.error'), 'Failed to create status');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    mode,
    text,
    backgroundColor,
    mediaUri,
    mediaType,
    caption,
    isSubmitting,
    createTextStatus,
    createImageStatus,
    createVideoStatus,
    router,
  ]);

  // Render text status editor
  const renderTextEditor = () => (
    <View style={[styles.textEditor, { backgroundColor }]}>
      <TextInput
        style={[styles.textInput, { color: getTextColor(backgroundColor) }]}
        placeholder={t('status.typeStatus')}
        placeholderTextColor={getTextColor(backgroundColor) + '80'}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={500}
        autoFocus
        textAlignVertical="center"
        textAlign="center"
      />
    </View>
  );

  // Render media preview
  const renderMediaPreview = () => (
    <View style={styles.mediaPreview}>
      {mediaUri ? (
        <>
          <Image
            source={{ uri: mediaUri }}
            style={styles.mediaImage}
            contentFit="contain"
          />
          {/* Caption input */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder={t('status.addCaption')}
              placeholderTextColor={Colors.textSecondary}
              value={caption}
              onChangeText={setCaption}
              maxLength={200}
            />
          </View>
        </>
      ) : (
        <View style={styles.mediaPlaceholder}>
          <View style={styles.mediaButtons}>
            <Pressable
              style={styles.mediaButton}
              onPress={() => handleSelectMedia('camera')}
            >
              <Ionicons name="camera" size={40} color={Colors.primary} />
              <Text style={styles.mediaButtonText}>{t('common.camera')}</Text>
            </Pressable>
            <Pressable
              style={styles.mediaButton}
              onPress={() => handleSelectMedia('gallery')}
            >
              <Ionicons name="images" size={40} color={Colors.primary} />
              <Text style={styles.mediaButtonText}>{t('common.gallery')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  // Render color picker for text status
  const renderColorPicker = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.colorPicker}
    >
      {BACKGROUND_COLORS.map((color) => (
        <Pressable
          key={color}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            backgroundColor === color && styles.colorOptionSelected,
          ]}
          onPress={() => setBackgroundColor(color)}
        >
          {backgroundColor === color && (
            <Ionicons name="checkmark" size={18} color={getTextColor(color)} />
          )}
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>

          {/* Mode Tabs */}
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'text' && styles.tabActive]}
              onPress={() => setMode('text')}
            >
              <Ionicons
                name="text"
                size={20}
                color={mode === 'text' ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  mode === 'text' && styles.tabTextActive,
                ]}
              >
                {t('status.text')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'media' && styles.tabActive]}
              onPress={() => setMode('media')}
            >
              <Ionicons
                name="image"
                size={20}
                color={mode === 'media' ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  mode === 'media' && styles.tabTextActive,
                ]}
              >
                {t('status.media')}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handlePost}
            style={[
              styles.postButton,
              isSubmitting && styles.postButtonDisabled,
            ]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.textInverse} />
            ) : (
              <Ionicons name="send" size={20} color={Colors.textInverse} />
            )}
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {mode === 'text' ? renderTextEditor() : renderMediaPreview()}
        </View>

        {/* Color picker for text mode */}
        {mode === 'text' && (
          <View style={styles.colorPickerContainer}>
            {renderColorPicker()}
          </View>
        )}

        {/* Change media button */}
        {mode === 'media' && mediaUri && (
          <View style={styles.changeMediaContainer}>
            <Pressable
              style={styles.changeMediaButton}
              onPress={() => {
                setMediaUri(null);
                setCaption('');
              }}
            >
              <Ionicons name="refresh" size={20} color={Colors.primary} />
              <Text style={styles.changeMediaText}>{t('status.changeMedia')}</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primaryFaded,
  },
  tabText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  postButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },

  // Text Editor
  textEditor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  textInput: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xxl,
    textAlign: 'center',
    width: '100%',
    maxHeight: '70%',
  },

  // Color Picker
  colorPickerContainer: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  colorPicker: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  // Media Preview
  mediaPreview: {
    flex: 1,
    backgroundColor: Colors.textPrimary,
  },
  mediaImage: {
    flex: 1,
    width: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captionInput: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
    padding: Spacing.sm,
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  mediaButton: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    minWidth: 120,
  },
  mediaButtonText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },

  // Change Media
  changeMediaContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  changeMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
  },
  changeMediaText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.base,
    color: Colors.primary,
  },
});
