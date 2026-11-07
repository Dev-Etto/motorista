import { useTranslation } from 'react-i18next';
import { EarningsEstimate } from '@domain/offer/offerLog';
import { useFormat } from '@shared/i18n/format';
import { AppText, Card, ListRow } from '@shared/ui/primitives';

export function EstimateCard({ estimate }: { estimate: EarningsEstimate }) {
  const { t } = useTranslation('offers');
  const format = useFormat();
  return (
    <Card title={t('estimate.title')}>
      <AppText variant="display" bold>
        {format.money(estimate.totalCents)}
      </AppText>
      <AppText variant="caption" tone="muted">
        {t('estimate.disclaimer')}
      </AppText>
      {estimate.byPlatform.map((platform) => (
        <ListRow key={platform.source} title={platform.source} subtitle={t('estimate.trips', { count: platform.trips })} value={format.money(platform.cents)} />
      ))}
    </Card>
  );
}
