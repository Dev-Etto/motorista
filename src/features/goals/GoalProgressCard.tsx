import { Card, ProgressBar, Stat, StatGrid } from '@/shared/ui/primitives';
import { formatBRL } from '@/shared/utils/money';
import { loadGoalProgress } from './goalProgress';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

export function GoalProgressCard({ progress }: { progress: GoalProgress }) {
  return (
    <Card title="Meta do mês">
      <ProgressBar progress={progress.progress} />
      <StatGrid>
        <Stat label="Meta de hoje" value={formatBRL(progress.dailyTargetCents)} tone="accent" />
        <Stat label="Falta faturar" value={formatBRL(progress.remainingCents)} />
        <Stat label="Faturamento necessário" value={formatBRL(progress.requiredGrossCents)} />
        <Stat label="Já faturado" value={formatBRL(progress.grossSoFarCents)} />
      </StatGrid>
    </Card>
  );
}
