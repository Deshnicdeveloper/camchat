/**
 * Storage Screen
 * Storage/data preferences and cache management.
 */

import { Alert } from 'react-native';
import { t } from '../../../lib/i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  SettingsScaffold,
  SettingsGroup,
  SettingsToggle,
  SettingsRow,
} from '../../../components/settings/SettingsKit';
import { Colors } from '../../../constants';

export default function StorageScreen() {
  const { chats, setChats } = useSettingsStore();

  const handleClearCache = () => {
    Alert.alert(t('settings.clearCache'), t('settings.cacheCleared'));
  };

  const comingSoon = () => Alert.alert(t('settings.storage'), t('settings.comingSoon'));

  return (
    <SettingsScaffold title={t('settings.storage')} subtitle={t('settings.storageSubtitle')}>
      <SettingsGroup>
        <SettingsToggle
          icon="cloud-download-outline"
          label={t('settings.mediaAutoDownload')}
          value={chats.mediaAutoDownload}
          onValueChange={(v) => setChats({ mediaAutoDownload: v })}
        />
        <SettingsRow icon="cellular-outline" label={t('settings.dataUsage')} onPress={comingSoon} />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          icon="trash-outline"
          label={t('settings.clearCache')}
          color={Colors.error}
          onPress={handleClearCache}
        />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
