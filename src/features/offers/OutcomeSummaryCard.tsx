import { OutcomeSummary } from '@/domain/offer/offerLog';
import { Card, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatPerKm } from '@/shared/utils/format';

export function OutcomeSummaryCard({ title, summary }: { title: string; summary: OutcomeSummary }) {
  return (
    <Card title={title}>
      <StatGrid>
        <Stat label="Recebidas" value={String(summary.received)} />
        <Stat label="Aceitas" value={String(summary.accepted)} />
        <Stat label="Não aceitas" value={String(summary.notAccepted)} />
        <Stat label="R$/km das aceitas" value={formatPerKm(summary.acceptedPerKmCents)} />
        <Stat label="R$/km das não aceitas" value={formatPerKm(summary.notAcceptedPerKmCents)} />
      </StatGrid>
    </Card>
  );
}
