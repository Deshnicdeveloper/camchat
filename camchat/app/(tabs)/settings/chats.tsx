/**
 * Chats Settings Screen
 * Chat behavior preferences. Persisted in the settings store.
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

export default function ChatsSettingsScreen() {
  const { chats, setChats } = useSettingsStore();

  const comingSoon = () => Alert.alert(t('settings.chatsSettings'), t('settings.comingSoon'));

  return (
    <SettingsScaffold title={t('settings.chatsSettings')} subtitle={t('settings.chatsSubtitle')}>
      <SettingsGroup>
        <SettingsToggle
          icon="return-down-back-outline"
          label={t('settings.enterToSend')}
          value={chats.enterToSend}
          onValueChange={(v) => setChats({ enterToSend: v })}
        />
        <SettingsToggle
          icon="cloud-download-outline"
          label={t('settings.mediaAutoDownload')}
          value={chats.mediaAutoDownload}
          onValueChange={(v) => setChats({ mediaAutoDownload: v })}
        />
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow icon="color-palette-outline" label={t('settings.chatWallpaper')} onPress={comingSoon} />
        <SettingsRow icon="cloud-upload-outline" label={t('settings.chatBackup')} onPress={comingSoon} />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
