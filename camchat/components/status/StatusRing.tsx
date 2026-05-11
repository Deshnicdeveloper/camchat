/**
 * StatusRing Component
 * Avatar with a colored ring indicating status (viewed/unviewed)
 */

import { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../constants';

interface StatusRingProps {
  avatarUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  hasUnviewed?: boolean;
  statusCount?: number;
  showAddButton?: boolean;
  onPress?: () => void;
}

const SIZES = {
  sm: { avatar: 40, ring: 46, addIcon: 14 },
  md: { avatar: 52, ring: 60, addIcon: 16 },
  lg: { avatar: 64, ring: 74, addIcon: 18 },
};

function StatusRing({
  avatarUrl,
  name,
  size = 'md',
  hasUnviewed = false,
  statusCount = 0,
  showAddButton = false,
  onPress,
}: StatusRingProps) {
  const dimensions = SIZES[size];
  const ringColor = hasUnviewed ? Colors.primary : Colors.textSecondary;
  const ringWidth = 2.5;

  // Calculate segment angles for multiple statuses
  const segments = Math.min(statusCount, 12); // Max 12 visible segments
  const gapAngle = segments > 1 ? 8 : 0; // Gap between segments in degrees
  const segmentAngle = segments > 0 ? (360 - gapAngle * segments) / segments : 360;

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <View
        style={[
          styles.container,
          {
            width: dimensions.ring,
            height: dimensions.ring,
            borderRadius: dimensions.ring / 2,
          },
        ]}
      >
        {/* Ring background */}
        {statusCount > 0 && (
          <View
            style={[
              styles.ring,
              {
                width: dimensions.ring,
                height: dimensions.ring,
                borderRadius: dimensions.ring / 2,
                borderWidth: ringWidth,
                borderColor: ringColor,
              },
            ]}
          />
        )}

        {/* Avatar container */}
        <View
          style={[
            styles.avatarContainer,
            {
              width: dimensions.avatar,
              height: dimensions.avatar,
              borderRadius: dimensions.avatar / 2,
            },
          ]}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[
                styles.avatar,
                {
                  width: dimensions.avatar,
                  height: dimensions.avatar,
                  borderRadius: dimensions.avatar / 2,
                },
              ]}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {
                  width: dimensions.avatar,
                  height: dimensions.avatar,
                  borderRadius: dimensions.avatar / 2,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={dimensions.avatar * 0.5}
                color={Colors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Add button (for "My Status" when no status exists) */}
        {showAddButton && (
          <View
            style={[
              styles.addButton,
              {
                width: dimensions.addIcon + 8,
                height: dimensions.addIcon + 8,
                borderRadius: (dimensions.addIcon + 8) / 2,
              },
            ]}
          >
            <Ionicons name="add" size={dimensions.addIcon} color={Colors.textInverse} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  avatar: {
    backgroundColor: Colors.surface,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
});

export default memo(StatusRing);
