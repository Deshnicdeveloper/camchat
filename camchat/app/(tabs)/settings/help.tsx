/**
 * Help Screen
 * FAQ, contact support and bug reporting.
 */

import { Alert, Linking } from 'react-native';
import { t } from '../../../lib/i18n';
import {
  SettingsScaffold,
  SettingsGroup,
  SettingsRow,
} from '../../../components/settings/SettingsKit';

const SUPPORT_EMAIL = 'support@camchat.app';

export default function HelpScreen() {
  const openEmail = async (subject: string) => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('settings.contactSupport'), SUPPORT_EMAIL);
    }
  };

  return (
    <SettingsScaffold title={t('settings.help')} subtitle={t('settings.helpSubtitle')}>
      <SettingsGroup>
        <SettingsRow
          icon="help-circle-outline"
          label={t('settings.faq')}
          onPress={() => Alert.alert(t('settings.faq'), t('settings.comingSoon'))}
        />
        <SettingsRow
          icon="mail-outline"
          label={t('settings.contactSupport')}
          onPress={() => openEmail('CamChat Support')}
        />
        <SettingsRow
          icon="bug-outline"
          label={t('settings.reportBug')}
          onPress={() => openEmail('CamChat Bug Report')}
        />
      </SettingsGroup>
    </SettingsScaffold>
  );
}
