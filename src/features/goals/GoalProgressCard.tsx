import { LearnMore } from '@/shared/ui/LearnMore';
import { AppText, Button, Card, Notice, ProgressBar, Stat, StatGrid } from '@/shared/ui/primitives';
import { profitTone } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { describeGoalDay, describePartialShifts } from './goalMessages';
import { loadGoalProgress } from '@/application/goalProgress';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

interface GoalProgressCardProps {
  progress: GoalProgress;
  onOpenDetails?: () => void;
}

export function GoalProgressCard({ progress, onOpenDetails }: GoalProgressCardProps) {
  return (
    <Card title="Meta do mês">
      <AppText bold tone={profitTone(progress.profitSoFarCents)}>
        {formatBRL(progress.profitSoFarCents)} <AppText tone="muted">de {formatBRL(progress.goal.desiredProfitCents)} de lucro</AppText>
      </AppText>
      <ProgressBar progress={progress.progress} />
      {progress.reached ? null : (
        <StatGrid>
          {progress.dailyTargetCents === null || !progress.todayIsWorkDay ? null : (
            <>
              <Stat label={progress.dayOverride === null ? 'Meta de lucro hoje' : 'Meta de hoje, ajustada por você'} value={formatBRL(progress.dailyTargetCents)} />
              <Stat label="Lucro de hoje" value={formatBRL(progress.profitTodayCents)} />
            </>
          )}
          <Stat label="Falta lucrar no mês" value={formatBRL(progress.remainingCents)} />
        </StatGrid>
      )}
      <AppText variant="caption">{describeGoalDay(progress)}</AppText>
      {progress.partialCount > 0 ? <Notice message={describePartialShifts(progress.partialCount)} /> : null}
      {onOpenDetails ? <Button label="Ver meta e plano" variant="secondary" onPress={onOpenDetails} /> : null}
      {onOpenDetails ? null : (
        <LearnMore title="Como essa conta funciona?">
          <AppText variant="caption">O lucro é o mesmo de &quot;Neste mês&quot; no início: o que você faturou menos o custo por km das jornadas e as despesas.</AppText>
          <AppText variant="caption">O custo fixo, como seguro e parcela, entra diluído em cada km, pelos km que você prevê rodar no mês.</AppText>
          <AppText variant="caption">Por isso, o Mês fechado, em Relatórios, pode dar um valor diferente: ele desconta o custo fixo inteiro. Se você rodar menos que o previsto, ele será menor que o lucro daqui.</AppText>
          <AppText variant="caption">A meta de hoje divide o que faltava no começo do dia pelos dias de trabalho restantes. Ela não muda durante o dia.</AppText>
        </LearnMore>
      )}
    </Card>
  );
}
