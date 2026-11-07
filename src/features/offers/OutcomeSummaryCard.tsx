import { useTranslation } from 'react-i18next';
import { OutcomeSummary } from '@domain/offer/offerLog';
import { useFormat } from '@shared/i18n/format';
import { Card, Stat, StatGrid } from '@shared/ui/primitives';

export function OutcomeSummaryCard({ title, summary }: { title: string; summary: OutcomeSummary }) {
  const { t } = useTranslation('offers');
  const format = useFormat();
  return (
    <Card title={title}>
      <StatGrid>
        <Stat label={t('outcomeSummary.received')} value={String(summary.received)} />
        <Stat label={t('outcomeSummary.accepted')} value={String(summary.accepted)} />
        <Stat label={t('outcomeSummary.notAccepted')} value={String(summary.notAccepted)} />
        <Stat label={t('outcomeSummary.perDistanceAccepted', { label: format.perDistanceLabel })} value={format.perDistance(summary.acceptedPerKmCents)} />
        <Stat
          label={t('outcomeSummary.perDistanceNotAccepted', { label: format.perDistanceLabel })}
          value={format.perDistance(summary.notAcceptedPerKmCents)}
        />
      </StatGrid>
    </Card>
  );
}
