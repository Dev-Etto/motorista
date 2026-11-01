import { loadGoalProgress } from './goalProgress';
import { Button, Card, ListRow, Notice } from '@/shared/ui/primitives';
import { formatPerHour, formatPerKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

export function GoalPlanCard({ progress, applied, onApply }: { progress: GoalProgress; applied: boolean; onApply: () => void }) {
  const { suggestion } = progress;
  if (!suggestion) return <Notice tone="accent" message="Cadastre seu veículo para ver quanto cada corrida precisa pagar." />;

  return (
    <Card title="Para chegar nessa meta">
      <ListRow title="Faturar por dia de trabalho" value={formatBRL(suggestion.grossPerWorkDayCents)} />
      <ListRow title="Corridas que pagam, por km, a partir de" value={formatPerKm(suggestion.targetPerKmCents)} />
      <ListRow title="Ganho por hora, pelo menos" value={formatPerHour(suggestion.targetPerHourCents)} />
      {applied ? (
        <Notice tone="positive" message="A nota das ofertas já usa esses valores." />
      ) : (
        <Button label="Usar esses valores na nota das ofertas" variant="secondary" onPress={onApply} />
      )}
    </Card>
  );
}
