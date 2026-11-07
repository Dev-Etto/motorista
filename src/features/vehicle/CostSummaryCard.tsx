import { useTranslation } from 'react-i18next';
import { CostBreakdown } from '@domain/vehicle/costs';
import { useFormat } from '@shared/i18n/format';
import { Card, Collapsible, ListRow, Stat, StatGrid } from '@shared/ui/primitives';

export function CostSummaryCard({ costs, detailed }: { costs: CostBreakdown; detailed?: boolean }) {
  const { t } = useTranslation('vehicle');
  const format = useFormat();
  const unit = format.distanceUnit;
  const perMonth = (cents: number) => t('costSummary.perMonth', { amount: format.money(cents) });

  if (detailed) {
    return (
      <Collapsible title={t('costSummary.detailsTitle')}>
        <ListRow title={t('costSummary.fuel')} value={format.perDistance(costs.fuelPerKm)} />
        <ListRow title={t('costSummary.oil')} value={format.perDistance(costs.oilPerKm)} />
        <ListRow title={t('costSummary.tires')} value={format.perDistance(costs.tiresPerKm)} />
        <ListRow title={t('costSummary.maintenance')} value={format.perDistance(costs.maintenancePerKm)} />
        <ListRow title={t('costSummary.insurance')} value={perMonth(costs.insuranceMonthly)} />
        <ListRow title={t('costSummary.taxes')} value={perMonth(costs.taxesMonthly)} />
        <ListRow title={t('costSummary.payment')} value={perMonth(costs.paymentMonthly)} />
        <ListRow title={t('costSummary.depreciation')} value={perMonth(costs.depreciationMonthly)} />
      </Collapsible>
    );
  }

  return (
    <Card title={t('costSummary.title', { unit })}>
      <StatGrid>
        <Stat label={t('costSummary.fullPerDistance', { unit })} value={format.perDistance(costs.fullPerKm)} tone="accent" />
        <Stat label={t('costSummary.variable')} value={format.perDistance(costs.variablePerKm)} />
        <Stat label={t('costSummary.fixedMonthly')} value={format.money(costs.fixedMonthly)} />
        <Stat label={t('costSummary.fixedPerDistance', { unit })} value={format.perDistance(costs.fixedPerKm)} />
      </StatGrid>
    </Card>
  );
}
