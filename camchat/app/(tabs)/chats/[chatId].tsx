/**
 * Chat Room Screen
 * Individual chat conversation view
 */

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { Pressable } from 'react-native';

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons
            name="videocam-outline"
            size={24}
            color={Colors.textInverse}
            style={styles.headerIcon}
          />
          <Ionicons
            name="call-outline"
            size={24}
            color={Colors.textInverse}
            style={styles.headerIcon}
          />
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={Colors.textInverse}
          />
        </View>
      </View>

      {/* Chat Content Placeholder */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>Chat ID: {chatId}</Text>
        <Text style={styles.placeholderText}>Messages will appear here</Text>
      </View>

      {/* Message Input Placeholder */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="happy-outline"
            size={24}
            color={Colors.textSecondary}
          />
          <Text style={styles.inputPlaceholder}>Type a message</Text>
          <Ionicons
            name="attach-outline"
            size={24}
            color={Colors.textSecondary}
          />
        </View>
        <View style={styles.sendButton}>
          <Ionicons name="mic" size={24} color={Colors.textInverse} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 25,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  inputPlaceholder: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
