import { View, Text, StyleSheet, Modal, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants';
import { t } from '../lib/i18n';

interface QRCodeModalProps {
  visible: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

export default function QRCodeModal({
  visible,
  userId,
  userName,
  onClose,
}: QRCodeModalProps) {
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.textInverse} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('profile.myQRCode') || 'My QR Code'}</Text>
          <Pressable onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-social" size={24} color={Colors.textInverse} />
          </Pressable>
        </View>

        {/* QR Code Section */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>{userName}</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrValue}
                size={280}
                color={Colors.textPrimary}
                backgroundColor={Colors.background}
                logo={undefined}
              />
            </View>
          </View>
          <Text style={styles.description}>
            {t('profile.scanQRDescription') || 'Scan this QR code to connect with me'}
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.footer}>
          <Pressable style={styles.button} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={Colors.textInverse} />
            <Text style={styles.buttonText}>
              {t('common.share') || 'Share'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textInverse,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  qrContainer: {
    marginVertical: Spacing.xl,
  },
  qrWrapper: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.textInverse,
    marginLeft: Spacing.sm,
  },
});
