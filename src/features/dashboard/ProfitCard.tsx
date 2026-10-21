import { ShiftSummary } from '@/domain/shift/summary';
import { AppText, Card, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatDuration } from '@/shared/utils/dates';
import { formatPerHour, formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

export function ProfitCard({ title, summary, hero }: { title: string; summary: ShiftSummary; hero?: boolean }) {
  return (
    <Card title={title}>
      <AppText variant={hero ? 'display' : 'title'} bold tone={profitTone(summary.profitCents)}>
        {formatBRL(summary.profitCents)}
      </AppText>
      <StatGrid>
        <Stat label="Faturamento" value={formatBRL(summary.grossCents)} />
        <Stat label="Tempo" value={formatDuration(summary.minutes)} />
        <Stat label="Por km" value={formatPerKm(summary.grossPerKm)} />
        <Stat label="Lucro por hora" value={formatPerHour(summary.profitPerHour)} />
      </StatGrid>
    </Card>
  );
}
