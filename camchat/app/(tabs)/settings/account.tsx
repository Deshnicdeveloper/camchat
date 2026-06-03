/**
 * Account Screen
 * Shows account info and account-level actions.
 */

import { Alert } from 'react-native';
import { router } from 'expo-router';
import { t } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/authStore';
import { SettingsScaffold, SettingsGroup, SettingsRow } from '../../../components/settings/SettingsKit';
import { Colors } from '../../../constants';

export default function AccountScreen() {
  const { user } = useAuthStore();

  const comingSoon = () => Alert.alert(t('settings.account'), t('settings.comingSoon'));

  return (
    <SettingsScaffold title={t('settings.account')} subtitle={t('settings.accountSubtitle')}>
      <SettingsGroup>
        <SettingsRow
          icon="call-outline"
          label={t('settings.phoneNumber')}
          value={user?.phone || '—'}
          showChevron={false}
        />
        <SettingsRow
          icon="person-outline"
          label={t('settings.editProfile')}
          onPress={() => router.push('/(tabs)/settings/edit-profile')}
        />
        <SettingsRow
          icon="swap-horizontal-outline"
          label={t('settings.changeNumber')}
          onPress={comingSoon}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon="trash-outline"
          label={t('settings.deleteAccount')}
          color={Colors.error}
          onPress={comingSoon}
        />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
