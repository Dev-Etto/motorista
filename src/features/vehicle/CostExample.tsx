import { AppText, Card, ListRow } from '@/shared/ui/primitives';
import { profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

const EXAMPLE_VALUE_CENTS = 2000;
const EXAMPLE_KM = 10;

export function CostExample({ costPerKm }: { costPerKm: number }) {
  const costCents = costPerKm * EXAMPLE_KM;

  return (
    <Card title="Na prática">
      <AppText tone="muted">Uma corrida de {formatBRL(EXAMPLE_VALUE_CENTS)} com {EXAMPLE_KM} km:</AppText>
      <ListRow title="Você recebe" value={formatBRL(EXAMPLE_VALUE_CENTS)} />
      <ListRow title="Vai para o carro" subtitle="Combustível, desgaste e outros custos" value={`- ${formatBRL(costCents)}`} />
      <ListRow title="Sobra para você" value={formatBRL(EXAMPLE_VALUE_CENTS - costCents)} valueTone={profitTone(EXAMPLE_VALUE_CENTS - costCents)} />
    </Card>
  );
}
