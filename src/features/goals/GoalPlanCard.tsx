import { loadGoalProgress } from '@/application/goalProgress';
import { AppText, Card, ListRow, Notice } from '@/shared/ui/primitives';
import { formatNumber, formatBRL } from '@/shared/utils/money';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

export function GoalPlanCard({ progress }: { progress: GoalProgress }) {
  const { suggestion } = progress;
  if (!suggestion) return <Notice tone="accent" message="Cadastre seu veículo para ver quanto faturar e quanto cada corrida precisa pagar." />;

  return (
    <Card title="Seu plano para o mês">
      <AppText variant="caption" tone="muted">
        É uma previsão feita no começo, com os km que você informou. Os mínimos por corrida saem dela.
      </AppText>
      <ListRow title="Faturamento previsto no mês" value={formatBRL(progress.requiredGrossCents)} />
      <ListRow title="Por dia de trabalho" value={formatBRL(suggestion.grossPerWorkDayCents)} />
      <ListRow title="Km previstos por dia" value={`${formatNumber(progress.plannedKmPerDay, 0)} km`} />
    </Card>
  );
}
