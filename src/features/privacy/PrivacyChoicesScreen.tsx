import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_PRIVACY_CHOICES } from '@application/privacyChoices';
import { AppText, Button, Card, Screen, ToggleRow } from '@shared/ui/primitives';
import { usePrivacyChoices } from './usePrivacyChoices';

export default function PrivacyChoicesScreen() {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const { choices, save } = usePrivacyChoices();
  const [usageStats, setUsageStats] = useState(DEFAULT_PRIVACY_CHOICES.usageStats);
  const [crashReports, setCrashReports] = useState(DEFAULT_PRIVACY_CHOICES.crashReports);

  useEffect(() => {
    if (!choices) return;
    setUsageStats(choices.usageStats);
    setCrashReports(choices.crashReports);
  }, [choices]);

  const confirm = async () => {
    await save({ usageStats, crashReports });
    router.back();
  };

  return (
    <Screen>
      <AppText tone="muted">{t('privacyChoices.intro')}</AppText>
      <Card>
        <ToggleRow label={t('privacyChoices.usageStats.label')} hint={t('privacyChoices.usageStats.hint')} value={usageStats} onChange={setUsageStats} />
      </Card>
      <Card>
        <ToggleRow
          label={t('privacyChoices.crashReports.label')}
          hint={t('privacyChoices.crashReports.hint')}
          value={crashReports}
          onChange={setCrashReports}
        />
      </Card>
      <Card title={t('privacyChoices.never.title')}>
        <AppText>{t('privacyChoices.never.body')}</AppText>
      </Card>
      <Button label={t('privacyChoices.save')} onPress={confirm} />
    </Screen>
  );
}
