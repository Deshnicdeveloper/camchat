/**
 * OTP Verification Screen
 * User enters the verification code sent to their phone
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
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';
import { useAuth } from '../../hooks/useAuth';
import { sendOTP } from '../../lib/auth';
import { app } from '../../lib/firebase';

const OTP_LENGTH = 6;
const RESEND_TIMEOUT = 60;

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  // Ref for reCAPTCHA verifier (for resend functionality)
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  const { verifyCode, phoneNumber } = useAuth();

  // Get the phone number from params or auth store
  const displayPhone = phone || phoneNumber || '+237 XXX XXX XXX';

  useEffect(() => {
    // Start countdown timer
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus last filled input or next empty
      const lastFilledIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-advance to next input
      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) return;

    setIsVerifying(true);

    const result = await verifyCode(otpCode);

    setIsVerifying(false);

    if (result.success) {
      if (result.isNewUser) {
        // New user - navigate to profile setup
        router.push('/(auth)/profile-setup');
      } else {
        // Existing user - navigate to main app
        router.replace('/(tabs)/chats');
      }
    } else {
      Alert.alert(
        t('common.error'),
        result.error || t('auth.invalidCode'),
        [{ text: t('common.ok') }]
      );
      // Clear the OTP inputs on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;

    const phoneToResend = phone || phoneNumber;
    if (!phoneToResend) {
      Alert.alert(t('common.error'), t('auth.noPhoneNumber'));
      return;
    }

    setIsResending(true);

    try {
      const result = await sendOTP(phoneToResend, recaptchaVerifier.current!);

      setIsResending(false);

      if (result.success) {
        setResendTimer(RESEND_TIMEOUT);
        Alert.alert(t('common.success'), t('auth.codeSent'));
      } else {
        Alert.alert(
          t('common.error'),
          result.error || t('auth.sendOtpError'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      setIsResending(false);
      Alert.alert(
        t('common.error'),
        t('auth.sendOtpError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const isComplete = otp.every((digit) => digit !== '');

  return (
    <SafeAreaView style={styles.container}>
      {/* Firebase reCAPTCHA Modal (for resend) */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
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
              <Text style={styles.title}>{t('auth.otpTitle')}</Text>
              <Text style={styles.subtitle}>
                {t('auth.otpSubtitle')} {displayPhone}
              </Text>

              {/* OTP Inputs */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Resend Timer */}
              <View style={styles.resendContainer}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimer}>
                    {t('auth.resendIn')} {resendTimer}s
                  </Text>
                ) : isResending ? (
                  <ActivityIndicator color={Colors.textInverse} size="small" />
                ) : (
                  <Pressable onPress={handleResend}>
                    <Text style={styles.resendLink}>{t('auth.resendCode')}</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Verify Button */}
            <View style={styles.footer}>
              <Pressable
                style={[styles.button, (!isComplete || isVerifying) && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={!isComplete || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={[styles.buttonText, !isComplete && styles.buttonTextDisabled]}>
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
    alignItems: 'center',
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.xl,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  resendContainer: {
    marginTop: Spacing.xl,
  },
  resendTimer: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    opacity: 0.7,
  },
  resendLink: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.size.sm,
    color: Colors.textInverse,
    textDecorationLine: 'underline',
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
