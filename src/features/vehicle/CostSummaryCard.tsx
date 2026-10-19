import { CostBreakdown } from '@/domain/vehicle/costs';
import { Card, ListRow, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatPerKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

export function CostSummaryCard({ costs, detailed }: { costs: CostBreakdown; detailed?: boolean }) {
  return (
    <Card title="Seu custo por km">
      <StatGrid>
        <Stat label="Custo completo" value={formatPerKm(costs.fullPerKm)} tone="accent" />
        <Stat label="Custo variável" value={formatPerKm(costs.variablePerKm)} />
        <Stat label="Fixos por mês" value={formatBRL(costs.fixedMonthly)} />
        <Stat label="Fixos por km" value={formatPerKm(costs.fixedPerKm)} />
      </StatGrid>
      {detailed ? (
        <>
          <ListRow title="Combustível" value={formatPerKm(costs.fuelPerKm)} />
          <ListRow title="Óleo" value={formatPerKm(costs.oilPerKm)} />
          <ListRow title="Pneus" value={formatPerKm(costs.tiresPerKm)} />
          <ListRow title="Manutenção" value={formatPerKm(costs.maintenancePerKm)} />
          <ListRow title="Seguro" value={`${formatBRL(costs.insuranceMonthly)}/mês`} />
          <ListRow title="IPVA e licenciamento" value={`${formatBRL(costs.taxesMonthly)}/mês`} />
          <ListRow title="Parcela ou aluguel" value={`${formatBRL(costs.paymentMonthly)}/mês`} />
          <ListRow title="Depreciação" value={`${formatBRL(costs.depreciationMonthly)}/mês`} />
        </>
      ) : null}
    </Card>
  );
}
