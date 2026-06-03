/**
 * Security Screen
 * Security preferences and encryption info.
 */

import { t } from '../../../lib/i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import {
  SettingsScaffold,
  SettingsGroup,
  SettingsToggle,
} from '../../../components/settings/SettingsKit';

export default function SecurityScreen() {
  const { security, setSecurity } = useSettingsStore();

  return (
    <SettingsScaffold title={t('settings.security')} subtitle={t('settings.securitySubtitle')}>
      <SettingsGroup footer={t('settings.encryptionInfo')}>
        <SettingsToggle
          icon="shield-checkmark-outline"
          label={t('settings.securityNotifications')}
          value={security.securityNotifications}
          onValueChange={(v) => setSecurity({ securityNotifications: v })}
        />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
