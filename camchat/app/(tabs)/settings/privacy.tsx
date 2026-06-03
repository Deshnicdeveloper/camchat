/**
 * Privacy Screen
 * Toggles for what other users can see. Persisted in the settings store.
 */

import { t } from '../../../lib/i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  SettingsScaffold,
  SettingsGroup,
  SettingsToggle,
} from '../../../components/settings/SettingsKit';

export default function PrivacyScreen() {
  const { privacy, setPrivacy } = useSettingsStore();

  return (
    <SettingsScaffold title={t('settings.privacy')} subtitle={t('settings.privacySubtitle')}>
      <SettingsGroup footer={t('settings.readReceiptsDesc')}>
        <SettingsToggle
          icon="time-outline"
          label={t('settings.lastSeenOnline')}
          value={privacy.lastSeenOnline}
          onValueChange={(v) => setPrivacy({ lastSeenOnline: v })}
        />
        <SettingsToggle
          icon="radio-outline"
          label={t('settings.onlineStatusVisible')}
          value={privacy.onlineStatusVisible}
          onValueChange={(v) => setPrivacy({ onlineStatusVisible: v })}
        />
        <SettingsToggle
          icon="image-outline"
          label={t('settings.profilePhotoVisible')}
          value={privacy.profilePhotoVisible}
          onValueChange={(v) => setPrivacy({ profilePhotoVisible: v })}
        />
        <SettingsToggle
          icon="checkmark-done-outline"
          label={t('settings.readReceipts')}
          value={privacy.readReceipts}
          onValueChange={(v) => setPrivacy({ readReceipts: v })}
        />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
