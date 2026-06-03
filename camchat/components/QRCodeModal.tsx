import { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius, ColorPalette } from '../constants';
import { t } from '../lib/i18n';
import { useColors } from '../hooks/useColors';

interface QRCodeModalProps {
  visible: boolean;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  onClose: () => void;
}

export default function QRCodeModal({
  visible,
  userId,
  userName,
  avatarUrl,
  onClose,
}: QRCodeModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const qrValue = `https://camchat.app/profile/${userId}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with me on CamChat! ${userName}\n${qrValue}`,
        title: 'Connect on CamChat',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header — explicit top inset so it never sits under the status bar */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <Pressable onPress={onClose} style={styles.iconButton} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.textInverse} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('profile.myQRCode') || 'My QR Code'}</Text>
          <Pressable onPress={handleShare} style={styles.iconButton} hitSlop={10}>
            <Ionicons name="share-social-outline" size={22} color={colors.textInverse} />
          </Pressable>
        </View>

        {/* Centered card */}
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitial}>
                  {(userName?.trim()?.[0] || '?').toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>{userName}</Text>
            <Text style={styles.handle}>CamChat</Text>

            <View style={styles.qrWrapper}>
              <QRCode
                value={qrValue}
                size={220}
                color="#0D0D0D"
                backgroundColor="#FFFFFF"
              />
            </View>

            <Text style={styles.description}>
              {t('profile.scanQRDescription') || 'Scan this code to add me on CamChat'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable style={styles.button} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={colors.textInverse} />
            <Text style={styles.buttonText}>{t('common.share') || 'Share'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
    iconButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.lg,
      color: colors.textInverse,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    card: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: Radius.xl,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primaryFaded,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: Spacing.md,
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarInitial: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.size.xxl,
      color: colors.primary,
    },
    name: {
      fontFamily: Typography.fontFamily.bold,
      fontSize: Typography.size.xl,
      color: colors.textPrimary,
      maxWidth: '90%',
    },
    handle: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: Spacing.lg,
    },
    qrWrapper: {
      padding: Spacing.md,
      backgroundColor: '#FFFFFF',
      borderRadius: Radius.lg,
    },
    description: {
      fontFamily: Typography.fontFamily.regular,
      fontSize: Typography.size.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.lg,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
    },
    button: {
      flexDirection: 'row',
      backgroundColor: colors.primaryDark,
      paddingVertical: Spacing.lg,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontFamily: Typography.fontFamily.semibold,
      fontSize: Typography.size.md,
      color: colors.textInverse,
      marginLeft: Spacing.sm,
    },
  });
