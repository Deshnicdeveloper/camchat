/**
 * Phone Input Screen
 * User enters their phone number for verification
 * Cameroon phone numbers: 9 digits, starting with 6 or 2
 */

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';
import { useAuthStore } from '../../store/authStore';
import { sendOTP } from '../../lib/auth';
import { app } from '../../lib/firebase';

// Timeout for OTP sending (30 seconds)
const OTP_TIMEOUT = 30000;

/**
 * Format phone number as user types: 6XX XXX XXX
 */
const formatPhoneNumber = (text: string): string => {
  // Remove all non-digit characters
  const digits = text.replace(/\D/g, '');

  // Limit to 9 digits
  const limited = digits.slice(0, 9);

  // Format as XXX XXX XXX
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  }
};

/**
 * Validate Cameroon phone number
 * Must be exactly 9 digits and start with 6 or 2
 */
const validateCameroonPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 9 && (digits.startsWith('6') || digits.startsWith('2'));
};

export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+237'); // Cameroon default
  const [isSending, setIsSending] = useState(false);

  // Ref for reCAPTCHA verifier
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const { setPhoneNumber: storePhoneNumber, setVerificationInProgress } = useAuthStore();

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleContinue = async () => {
    if (!validateCameroonPhone(phoneNumber)) return;

    setIsSending(true);

    // Format full phone number with country code
    const fullPhoneNumber = countryCode + phoneNumber.replace(/\D/g, '');

    // Store the phone number in auth store
    storePhoneNumber(fullPhoneNumber);

    // Create a timeout promise
    const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ success: false, error: 'Request timed out. Please try again.' });
      }, OTP_TIMEOUT);
    });

    try {
      // Race between OTP send and timeout
      const result = await Promise.race([
        sendOTP(fullPhoneNumber, recaptchaVerifier.current!),
        timeoutPromise
      ]);

      setIsSending(false);

      if (result.success) {
        setVerificationInProgress(true);
        // Navigate to OTP screen with phone number
        router.push({
          pathname: '/(auth)/otp',
          params: { phone: fullPhoneNumber }
        });
      } else {
        Alert.alert(
          t('common.error'),
          result.error || t('auth.sendOtpError'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      setIsSending(false);
      console.error('Error in handleContinue:', error);
      Alert.alert(
        t('common.error'),
        t('auth.sendOtpError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const isValidPhone = validateCameroonPhone(phoneNumber);

  return (
    <SafeAreaView style={styles.container}>
      {/* Firebase reCAPTCHA Modal - Using visible verification for better reliability */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={false}
        title="Verify you're human"
        cancelLabel="Cancel"
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
              </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{t('auth.phoneTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.phoneSubtitle')}</Text>

              {/* Phone Input Card */}
              <View style={styles.card}>
                <View style={styles.inputRow}>
                  {/* Country Code */}
                  <Pressable style={styles.countryCode}>
                    <Text style={styles.flag}>🇨🇲</Text>
                    <Text style={styles.codeText}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                  </Pressable>

                  {/* Phone Number Input */}
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="6XX XXX XXX"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    maxLength={11}
                    autoFocus
                  />
                </View>
              </View>

              {/* reCAPTCHA Banner (required by Firebase) */}
              <FirebaseRecaptchaBanner
                style={styles.recaptchaBanner}
                textStyle={styles.recaptchaText}
                linkStyle={styles.recaptchaLink}
              />
            </View>

            {/* Continue Button */}
            <View style={styles.footer}>
              <Pressable
                style={[styles.button, (!isValidPhone || isSending) && styles.buttonDisabled]}
                onPress={handleContinue}
                disabled={!isValidPhone || isSending}
              >
                {isSending ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={[styles.buttonText, !isValidPhone && styles.buttonTextDisabled]}>
                    {t('auth.continue')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.size.xl,
    color: Colors.textInverse,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.base,
    color: Colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.divider,
  },
  flag: {
    fontSize: 24,
    marginRight: Spacing.xs,
  },
  codeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    marginRight: Spacing.xs,
  },
  phoneInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.lg,
    color: Colors.textPrimary,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recaptchaBanner: {
    marginTop: Spacing.lg,
  },
  recaptchaText: {
    color: Colors.textInverse,
    opacity: 0.7,
    fontSize: Typography.size.xs,
  },
  recaptchaLink: {
    color: Colors.textInverse,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  button: {
    backgroundColor: Colors.textInverse,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.md,
    color: Colors.primary,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
});
