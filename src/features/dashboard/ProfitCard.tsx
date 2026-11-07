import { useTranslation } from 'react-i18next';
import { ShiftSummary } from '@domain/shift/summary';
import { useFormat } from '@shared/i18n/format';
import { AppText, Card, Notice, Stat, StatGrid } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';

export function ProfitCard({ title, summary, hero }: { title: string; summary: ShiftSummary; hero?: boolean }) {
  const { t } = useTranslation('dashboard');
  const format = useFormat();
  return (
    <Card title={title}>
      <AppText variant={hero ? 'display' : 'title'} bold tone={profitTone(summary.profitCents)}>
        {format.money(summary.profitCents)}
      </AppText>
      <StatGrid>
        <Stat label={t('profitCard.gross')} value={format.money(summary.grossCents)} />
        <Stat label={t('profitCard.time')} value={format.duration(summary.minutes)} />
        <Stat label={t('profitCard.perKm', { context: format.distanceUnit })} value={format.perDistance(summary.grossPerKm)} />
        <Stat label={t('profitCard.profitPerHour')} value={format.perHour(summary.profitPerHour)} />
      </StatGrid>
      {summary.partialCount > 0 ? <Notice message={t('profitCard.partial', { context: format.distanceUnit, count: summary.partialCount })} /> : null}
    </Card>
  );
}
