/**
 * AttachmentPicker Component
 * Bottom sheet for selecting attachment type: Camera, Gallery, Document, Location
 */

import { memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';

type AttachmentType = 'camera' | 'gallery' | 'document' | 'location';

interface AttachmentOption {
  type: AttachmentType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}

const ATTACHMENT_OPTIONS: AttachmentOption[] = [
  {
    type: 'camera',
    icon: 'camera',
    label: 'attachments.camera',
    color: '#E91E63',
  },
  {
    type: 'gallery',
    icon: 'images',
    label: 'attachments.gallery',
    color: '#9C27B0',
  },
  {
    type: 'document',
    icon: 'document',
    label: 'attachments.document',
    color: '#3F51B5',
  },
  {
    type: 'location',
    icon: 'location',
    label: 'attachments.location',
    color: '#4CAF50',
  },
];

interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: AttachmentType) => void;
}

export const AttachmentPicker = memo(function AttachmentPicker({
  visible,
  onClose,
  onSelect,
}: AttachmentPickerProps) {
  const handleSelect = useCallback(
    (type: AttachmentType) => {
      console.log(`🎯 AttachmentPicker: ${type} button pressed`);
      onSelect(type);
    },
    [onSelect]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop - tapping closes the modal */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet content - does not close modal when tapped */}
        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('attachments.title')}</Text>

          {/* Options Grid */}
          <View style={styles.optionsGrid}>
            {ATTACHMENT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.optionButton}
                onPress={() => handleSelect(option.type)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.optionIcon, { backgroundColor: option.color }]}
                >
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={Colors.textInverse}
                  />
                </View>
                <Text style={styles.optionLabel}>{t(option.label)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.xl + 20, // Extra padding for safe area
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: 2,
  },
  title: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  optionButton: {
    width: '22%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cancelButton: {
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
});

export default AttachmentPicker;
