import { CostBreakdown } from '@/domain/vehicle/costs';
import { Card, Collapsible, ListRow, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatPerKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

export function CostSummaryCard({ costs, detailed }: { costs: CostBreakdown; detailed?: boolean }) {
  if (detailed) {
    return (
      <Collapsible title="Ver de onde vem esse custo">
        <ListRow title="Combustível" value={formatPerKm(costs.fuelPerKm)} />
        <ListRow title="Óleo" value={formatPerKm(costs.oilPerKm)} />
        <ListRow title="Pneus" value={formatPerKm(costs.tiresPerKm)} />
        <ListRow title="Manutenção" value={formatPerKm(costs.maintenancePerKm)} />
        <ListRow title="Seguro" value={`${formatBRL(costs.insuranceMonthly)}/mês`} />
        <ListRow title="IPVA e licenciamento" value={`${formatBRL(costs.taxesMonthly)}/mês`} />
        <ListRow title="Parcela ou aluguel" value={`${formatBRL(costs.paymentMonthly)}/mês`} />
        <ListRow title="Depreciação" value={`${formatBRL(costs.depreciationMonthly)}/mês`} />
      </Collapsible>
    );
  }

  return (
    <Card title="Seu custo por km">
      <StatGrid>
        <Stat label="Custo total por km" value={formatPerKm(costs.fullPerKm)} tone="accent" />
        <Stat label="Combustível e desgaste" value={formatPerKm(costs.variablePerKm)} />
        <Stat label="Contas fixas no mês" value={formatBRL(costs.fixedMonthly)} />
        <Stat label="Contas fixas por km" value={formatPerKm(costs.fixedPerKm)} />
      </StatGrid>
    </Card>
  );
}
