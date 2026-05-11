/**
 * CallStatus Component
 * Displays call status, duration, and network quality
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants';
import { formatCallDuration } from '../../lib/calls';
import { t } from '../../lib/i18n';
import type { CallStatus as CallStatusType } from '../../types';

interface CallStatusProps {
  status: CallStatusType;
  duration: number;
  networkQuality: 'excellent' | 'good' | 'poor' | 'unknown';
  isConnecting?: boolean;
}

export function CallStatus({
  status,
  duration,
  networkQuality,
  isConnecting,
}: CallStatusProps) {
  const statusText = useMemo(() => {
    if (isConnecting) return t('calls.connecting');

    switch (status) {
      case 'ringing':
        return t('calls.ringing');
      case 'ongoing':
        return formatCallDuration(duration);
      case 'ended':
        return t('calls.ended');
      case 'missed':
        return t('calls.missed');
      case 'declined':
        return t('calls.declined');
      default:
        return '';
    }
  }, [status, duration, isConnecting]);

  const networkIcon = useMemo(() => {
    switch (networkQuality) {
      case 'excellent':
        return 'cellular';
      case 'good':
        return 'cellular';
      case 'poor':
        return 'cellular-outline';
      default:
        return 'cellular-outline';
    }
  }, [networkQuality]);

  const networkColor = useMemo(() => {
    switch (networkQuality) {
      case 'excellent':
        return Colors.success;
      case 'good':
        return Colors.success;
      case 'poor':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  }, [networkQuality]);

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>{statusText}</Text>

      {status === 'ongoing' && (
        <View style={styles.networkIndicator}>
          <Ionicons name={networkIcon} size={16} color={networkColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
    opacity: 0.9,
  },
  networkIndicator: {
    padding: Spacing.xs,
  },
});

export default CallStatus;
