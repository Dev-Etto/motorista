import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { Button, Card, AppText } from '@shared/ui/primitives';

export function CostDependencyNotice({ costPerKm }: { costPerKm: number }) {
  const router = useRouter();
  const { t } = useTranslation('calculators');
  const format = useFormat();
  if (costPerKm > 0) return null;

  return (
    <Card>
      <AppText bold>{t('costNotice.title', { unit: format.distanceUnit })}</AppText>
      <AppText tone="muted">{t('costNotice.message')}</AppText>
      <Button label={t('costNotice.action')} onPress={() => router.push('/vehicle')} />
    </Card>
  );
}
