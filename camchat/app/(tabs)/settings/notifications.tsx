/**
 * Notifications Screen
 * Toggles for notification behavior. Persisted in the settings store.
 */

import { t } from '../../../lib/i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  SettingsScaffold,
  SettingsGroup,
  SettingsToggle,
} from '../../../components/settings/SettingsKit';

export default function NotificationsScreen() {
  const { notifications, setNotifications } = useSettingsStore();

  return (
    <SettingsScaffold
      title={t('settings.notifications')}
      subtitle={t('settings.notificationsSubtitle')}
    >
      <SettingsGroup>
        <SettingsToggle
          icon="chatbubble-outline"
          label={t('settings.messageNotifications')}
          value={notifications.messageNotifications}
          onValueChange={(v) => setNotifications({ messageNotifications: v })}
        />
        <SettingsToggle
          icon="people-outline"
          label={t('settings.groupNotifications')}
          value={notifications.groupNotifications}
          onValueChange={(v) => setNotifications({ groupNotifications: v })}
        />
        <SettingsToggle
          icon="volume-high-outline"
          label={t('settings.inAppSounds')}
          value={notifications.inAppSounds}
          onValueChange={(v) => setNotifications({ inAppSounds: v })}
        />
        <SettingsToggle
          icon="phone-portrait-outline"
          label={t('settings.vibrate')}
          value={notifications.vibrate}
          onValueChange={(v) => setNotifications({ vibrate: v })}
        />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
