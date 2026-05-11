/**
 * Status Viewer Screen
 * Full-screen status/story viewer with auto-advance and navigation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radius } from '../../../constants';
import { t } from '../../../lib/i18n';
import { useStatus } from '../../../hooks/useStatus';
import { useAuthStore } from '../../../store/authStore';
import { StatusProgressBar } from '../../../components/status';
import { formatStatusTime } from '../../../utils/formatTime';
import type { Status, UserProfile } from '../../../types';
import { getUsersByIds } from '../../../lib/contacts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATUS_DURATION = 5000; // 5 seconds per status

export default function StatusViewScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuthStore();
  const { getStatusesForUser, markAsViewed, myStatuses } = useStatus();

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [statusUser, setStatusUser] = useState<UserProfile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');

  const isOwnStatus = userId === user?.uid;

  // Load statuses and user info
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      setIsLoading(true);

      try {
        // Load statuses
        let loadedStatuses: Status[];
        if (isOwnStatus) {
          loadedStatuses = myStatuses;
        } else {
          loadedStatuses = await getStatusesForUser(userId);
        }

        setStatuses(loadedStatuses);

        // Load user info if not own status
        if (!isOwnStatus) {
          const users = await getUsersByIds([userId]);
          if (users.length > 0) {
            setStatusUser({
              uid: users[0].uid,
              displayName: users[0].displayName,
              avatarUrl: users[0].avatarUrl,
              about: users[0].about,
              isOnline: users[0].isOnline,
              lastSeen: users[0].lastSeen,
            });
          }
        } else if (user) {
          setStatusUser({
            uid: user.uid,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            about: user.about || '',
            isOnline: true,
            lastSeen: new Date(),
          });
        }
      } catch (error) {
        console.error('Error loading statuses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, isOwnStatus, myStatuses, getStatusesForUser, user]);

  // Mark status as viewed
  useEffect(() => {
    if (!isOwnStatus && statuses.length > 0 && currentIndex < statuses.length) {
      const currentStatus = statuses[currentIndex];
      if (user?.uid && !currentStatus.viewedBy.includes(user.uid)) {
        markAsViewed(currentStatus.id);
      }
    }
  }, [currentIndex, statuses, isOwnStatus, user?.uid, markAsViewed]);

  // Handle close
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Handle next status
  const handleNext = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  }, [currentIndex, statuses.length, handleClose]);

  // Handle previous status
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Handle tap navigation
  const handleTap = useCallback(
    (x: number) => {
      if (x < SCREEN_WIDTH / 3) {
        handlePrevious();
      } else if (x > (SCREEN_WIDTH * 2) / 3) {
        handleNext();
      }
    },
    [handlePrevious, handleNext]
  );

  // Handle reply
  const handleReply = useCallback(() => {
    if (!replyText.trim() || !statusUser) return;

    // TODO: Implement sending reply as DM
    Alert.alert(
      'Reply Sent',
      `Your reply to ${statusUser.displayName} has been sent.`
    );
    setReplyText('');
  }, [replyText, statusUser]);

  // Pan responder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        }
      },
    })
  ).current;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.textInverse} />
        </View>
      </SafeAreaView>
    );
  }

  if (statuses.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No statuses available</Text>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = statuses[currentIndex];

  // Render status content
  const renderContent = () => {
    switch (currentStatus.type) {
      case 'text':
        return (
          <View
            style={[
              styles.textContent,
              { backgroundColor: currentStatus.backgroundColor || Colors.primary },
            ]}
          >
            <Text style={styles.statusText}>{currentStatus.text}</Text>
          </View>
        );

      case 'image':
      case 'video':
        return (
          <View style={styles.mediaContent}>
            <Image
              source={{ uri: currentStatus.mediaUrl }}
              style={styles.mediaImage}
              contentFit="contain"
              transition={200}
            />
            {currentStatus.caption && (
              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>{currentStatus.caption}</Text>
              </View>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Progress Bars */}
      <StatusProgressBar
        count={statuses.length}
        currentIndex={currentIndex}
        duration={STATUS_DURATION}
        isPaused={isPaused}
        onComplete={handleNext}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {statusUser?.avatarUrl ? (
            <Image
              source={{ uri: statusUser.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={Colors.textSecondary} />
            </View>
          )}
          <View style={styles.userTextInfo}>
            <Text style={styles.userName}>
              {isOwnStatus ? t('status.myStatus') : statusUser?.displayName}
            </Text>
            <Text style={styles.timeAgo}>
              {formatStatusTime(currentStatus.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {isOwnStatus && (
            <View style={styles.viewCount}>
              <Ionicons name="eye-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.viewCountText}>
                {currentStatus.viewedBy.length}
              </Text>
            </View>
          )}
          <Pressable onPress={handleClose} style={styles.closeIcon}>
            <Ionicons name="close" size={28} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <Pressable
        style={styles.content}
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        onPressIn={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        {...panResponder.panHandlers}
      >
        {renderContent()}
      </Pressable>

      {/* Reply Input (only for other users' statuses) */}
      {!isOwnStatus && (
        <View style={styles.replyContainer}>
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder={`${t('status.replyTo')} ${statusUser?.displayName}...`}
              placeholderTextColor="rgba(255,255,255,0.6)"
              value={replyText}
              onChangeText={setReplyText}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            />
            {replyText.trim().length > 0 && (
              <Pressable style={styles.sendButton} onPress={handleReply}>
                <Ionicons name="send" size={20} color={Colors.primary} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* View list button for own statuses */}
      {isOwnStatus && currentStatus.viewedBy.length > 0 && (
        <Pressable
          style={styles.viewListButton}
          onPress={() => {
            Alert.alert(
              t('status.viewedBy'),
              `${currentStatus.viewedBy.length} ${t('status.views')}`
            );
          }}
        >
          <Ionicons name="chevron-up" size={24} color={Colors.textInverse} />
          <Text style={styles.viewListText}>
            {currentStatus.viewedBy.length} {t('status.views')}
          </Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
    marginBottom: Spacing.lg,
  },
  closeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  closeButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },
  closeIcon: {
    padding: Spacing.xs,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  statusText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xxl,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  mediaContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
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
    padding: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  captionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
    textAlign: 'center',
  },

  // Reply
  replyContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: Spacing.md,
  },
  replyInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
    paddingVertical: Spacing.md,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // View List
  viewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  viewListText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
  },
});
