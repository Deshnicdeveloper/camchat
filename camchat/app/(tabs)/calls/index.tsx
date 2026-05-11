/**
 * Calls Screen
 * Displays call log history with ability to call back
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Colors, Typography, Spacing, Radius } from '../../../constants';
import { t } from '../../../lib/i18n';
import { formatCallDuration, createCall } from '../../../lib/calls';
import { useCallHistory } from '../../../hooks/useCallHistory';
import { useAuthStore } from '../../../store/authStore';
import { useCallStore } from '../../../store/callStore';
import type { CallLog, CallType } from '../../../types';

// Format call timestamp for display
function formatCallTime(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm');
  }
  if (isYesterday(date)) {
    return t('time.yesterday');
  }
  if (isThisWeek(date)) {
    return format(date, 'EEEE');
  }
  return format(date, 'dd/MM/yyyy');
}

// Call log item component
function CallLogItem({
  callLog,
  currentUserId,
  onCallBack,
}: {
  callLog: CallLog;
  currentUserId: string;
  onCallBack: (userId: string, type: CallType) => void;
}) {
  const isOutgoing = callLog.callerId === currentUserId;
  const isMissed = callLog.status === 'missed';
  const isDeclined = callLog.status === 'declined';

  // Get the other user's profile
  const otherUser = isOutgoing ? callLog.receiverProfile : callLog.callerProfile;

  // Determine call direction icon
  const directionIcon = useMemo(() => {
    if (isOutgoing) {
      return 'arrow-up-circle-outline';
    }
    if (isMissed || isDeclined) {
      return 'close-circle-outline';
    }
    return 'arrow-down-circle-outline';
  }, [isOutgoing, isMissed, isDeclined]);

  // Determine status color
  const statusColor = useMemo(() => {
    if (isMissed || isDeclined) {
      return Colors.error;
    }
    return Colors.textSecondary;
  }, [isMissed, isDeclined]);

  // Format duration or status
  const statusText = useMemo(() => {
    if (isMissed) return t('calls.missed');
    if (isDeclined) return t('calls.declined');
    if (callLog.duration && callLog.duration > 0) {
      return formatCallDuration(callLog.duration);
    }
    return isOutgoing ? t('calls.outgoing') : t('calls.incoming');
  }, [isMissed, isDeclined, callLog.duration, isOutgoing]);

  return (
    <Pressable
      style={styles.callItem}
      onPress={() => onCallBack(otherUser.uid, callLog.type)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {otherUser.avatarUrl ? (
          <Image
            source={{ uri: otherUser.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color={Colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Text
          style={[styles.userName, (isMissed || isDeclined) && styles.missedText]}
          numberOfLines={1}
        >
          {otherUser.displayName}
        </Text>
        <View style={styles.callDetails}>
          <Ionicons name={directionIcon} size={16} color={statusColor} />
          <Text style={[styles.callStatus, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
      </View>

      {/* Time and Call Type */}
      <View style={styles.callMeta}>
        <Text style={styles.callTime}>{formatCallTime(callLog.createdAt)}</Text>
        <Pressable
          style={styles.callTypeButton}
          onPress={() => onCallBack(otherUser.uid, callLog.type)}
        >
          <Ionicons
            name={callLog.type === 'video' ? 'videocam' : 'call'}
            size={20}
            color={Colors.primary}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function CallsScreen() {
  const { user } = useAuthStore();
  const { setActiveCall, setRemoteUser } = useCallStore();
  const { callLogs, isLoading, error, refresh } = useCallHistory();

  // Handle call back
  const handleCallBack = useCallback(
    async (userId: string, type: CallType) => {
      if (!user?.uid) return;

      try {
        // Create a new call
        const result = await createCall(user.uid, userId, type);

        if (result.success && result.call) {
          setActiveCall(result.call);

          // Navigate to call screen
          router.push({
            pathname: '/call/[callId]',
            params: { callId: result.call.id, isIncoming: 'false' },
          });
        }
      } catch (err) {
        console.error('Error initiating call:', err);
      }
    },
    [user?.uid, setActiveCall]
  );

  // Handle new call button
  const handleNewCall = useCallback(() => {
    router.push('/new-chat');
  }, []);

  // Render call log item
  const renderItem = useCallback(
    ({ item }: { item: CallLog }) => (
      <CallLogItem
        callLog={item}
        currentUserId={user?.uid || ''}
        onCallBack={handleCallBack}
      />
    ),
    [user?.uid, handleCallBack]
  );

  // Key extractor
  const keyExtractor = useCallback((item: CallLog) => item.id, []);

  // Loading state
  if (isLoading && callLogs.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('calls.title')}</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color={Colors.textInverse} />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleNewCall}>
              <Ionicons name="call-outline" size={24} color={Colors.textInverse} />
            </Pressable>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && callLogs.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('calls.title')}</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton}>
              <Ionicons name="search-outline" size={24} color={Colors.textInverse} />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={handleNewCall}>
              <Ionicons name="call-outline" size={24} color={Colors.textInverse} />
            </Pressable>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('calls.title')}</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color={Colors.textInverse} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleNewCall}>
            <Ionicons name="call-outline" size={24} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>

      {/* Call List or Empty State */}
      <View style={styles.content}>
        {callLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={80} color={Colors.primary} />
            <Text style={styles.emptyText}>{t('calls.noCalls')}</Text>
          </View>
        ) : (
          <FlatList
            data={callLogs}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  retryText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  listContent: {
    paddingVertical: Spacing.sm,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  missedText: {
    color: Colors.error,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  callStatus: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
  },
  callMeta: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  callTime: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  callTypeButton: {
    padding: Spacing.xs,
  },
});
