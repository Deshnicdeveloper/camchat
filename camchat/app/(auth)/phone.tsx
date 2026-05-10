/**
 * Phone Input Screen
 * User enters their phone number for verification
 */

import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { t } from '../../lib/i18n';

export default function PhoneScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode] = useState('+237'); // Cameroon default

  const handleContinue = () => {
    if (phoneNumber.length >= 9) {
      router.push('/(auth)/otp');
    }
  };

  const isValidPhone = phoneNumber.length >= 9;

  return (
    <SafeAreaView style={styles.container}>
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
              onChangeText={setPhoneNumber}
              maxLength={12}
              autoFocus
            />
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.button, !isValidPhone && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValidPhone}
        >
          <Text style={[styles.buttonText, !isValidPhone && styles.buttonTextDisabled]}>
            {t('auth.continue')}
          </Text>
        </Pressable>
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
