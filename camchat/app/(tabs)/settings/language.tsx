/**
 * Language Screen
 * Lets the user switch between English and French. The choice is applied
 * immediately, persisted locally (auth store) and saved to their profile.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../../constants';
import { t } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/authStore';
import { useAuth } from '../../../hooks/useAuth';
import { SettingsScaffold, SettingsGroup } from '../../../components/settings/SettingsKit';
import type { AppLanguage } from '../../../types';

const LANGUAGES: { code: AppLanguage; labelKey: string; native: string }[] = [
  { code: 'en', labelKey: 'settings.english', native: 'English' },
  { code: 'fr', labelKey: 'settings.french', native: 'Français' },
];

export default function LanguageScreen() {
  const { language, setLanguage } = useAuthStore();
  const { updateProfile, user } = useAuth();
  // Local mirror so the checkmark updates instantly on tap
  const [selected, setSelected] = useState<AppLanguage>(language);

  const handleSelect = async (code: AppLanguage) => {
    setSelected(code);
    setLanguage(code); // applies locale + persists in auth store
    if (user?.uid) {
      // Persist to the Firestore profile (best-effort)
      updateProfile({ language: code }).catch(() => {});
    }
  };

  return (
    <SettingsScaffold title={t('settings.language')} subtitle={t('settings.languageSubtitle')}>
      <SettingsGroup>
        {LANGUAGES.map((lang, index) => {
          const isSelected = selected === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[styles.row, index === LANGUAGES.length - 1 && styles.lastRow]}
              onPress={() => handleSelect(lang.code)}
            >
              <View style={styles.textWrap}>
                <Text style={styles.label}>{t(lang.labelKey)}</Text>
                <Text style={styles.native}>{lang.native}</Text>
              </View>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              ) : (
                <View style={styles.radioOuter} />
              )}
            </Pressable>
          );
        })}
      </SettingsGroup>
    </SettingsScaffold>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  lastRow: { borderBottomWidth: 0 },
  textWrap: { flex: 1 },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },
  native: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.divider,
  },
});
