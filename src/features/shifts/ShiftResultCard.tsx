import { ShiftResult } from '@/domain/shift/shift';
import { AppText, Card, ListRow, Notice } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm, profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

export function ShiftResultCard({ result }: { result: ShiftResult }) {
  return (
    <Card title="Resultado">
      <AppText variant="title" bold tone={profitTone(result.profitCents)}>
        {formatBRL(result.profitCents)}
      </AppText>
      {result.partial ? <Notice message="Resultado parcial: falta informar os km ou os custos do veículo." /> : null}
      <ListRow title="Faturamento" value={formatBRL(result.grossCents)} />
      <ListRow title="Custo do veículo" value={formatBRL(result.vehicleCostCents)} />
      <ListRow title="Despesas da jornada" value={formatBRL(result.expensesCents)} />
      <ListRow title="Faturamento por km" value={formatPerKm(result.grossPerKm)} />
      <ListRow title="Faturamento por hora" value={formatPerHour(result.grossPerHour)} />
      <ListRow title="Lucro por hora" value={formatPerHour(result.profitPerHour)} />
    </Card>
  );
}
