import { useTranslation } from 'react-i18next';
import { saveWorkProfile, useWorkProfile } from '@application/workProfile';
import { AppText, Screen } from '@shared/ui/primitives';
import { reportError } from '@shared/utils/reportError';
import { WorkProfilePicker } from './WorkProfilePicker';

export default function WorkProfileScreen() {
  const { t } = useTranslation('settings');
  const profile = useWorkProfile();

  return (
    <Screen>
      <AppText tone="muted">{t('workProfile.hint')}</AppText>
      <WorkProfilePicker value={profile} onChange={(next) => saveWorkProfile(next).catch(reportError)} />
    </Screen>
  );
}
