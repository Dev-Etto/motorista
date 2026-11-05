import { loadGoalProgress } from './goalProgress';
import { Card, ListRow, Notice } from '@/shared/ui/primitives';
import { formatBRL } from '@/shared/utils/money';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

export function GoalPlanCard({ progress }: { progress: GoalProgress }) {
  const { suggestion } = progress;
  if (!suggestion) return <Notice tone="accent" message="Cadastre seu veículo para ver quanto cada corrida precisa pagar." />;

  return (
    <Card title="Para chegar nessa meta">
      <ListRow title="Faturar por dia de trabalho" value={formatBRL(suggestion.grossPerWorkDayCents)} />
    </Card>
  );
}
