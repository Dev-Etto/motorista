import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText, Button, ButtonRow, Card } from '@shared/ui/primitives';
import { usePrivacyChoices } from './usePrivacyChoices';

export function PrivacyChoicesCard() {
  const router = useRouter();
  const { t } = useTranslation(['settings', 'common']);
  const { choices, save } = usePrivacyChoices();
  if (!choices || choices.decidedAt) return null;

  return (
    <Card>
      <AppText variant="subtitle" bold>
        {t('privacyChoices.card.title')}
      </AppText>
      <AppText tone="muted">{t('privacyChoices.card.message')}</AppText>
      <ButtonRow>
        <Button label={t('privacyChoices.card.choose')} onPress={() => router.push('/privacy-choices')} />
        <Button label={t('common:actions.notNow')} variant="secondary" onPress={() => save({ usageStats: false, crashReports: choices.crashReports })} />
      </ButtonRow>
    </Card>
  );
}
