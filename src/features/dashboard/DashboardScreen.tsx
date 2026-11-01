import { useRouter } from 'expo-router';
import { NextStepCard } from '@/features/onboarding/NextStepCard';
import { GoalProgressCard } from '@/features/goals/GoalProgressCard';
import { InsightCard } from '@/features/insights/InsightCard';
import { ActiveShiftCard, NewShiftButton } from '@/features/shifts/ActiveShift';
import { LearnMore } from '@/shared/ui/LearnMore';
import { AppText, Button, Card, EmptyState, Notice, Screen } from '@/shared/ui/primitives';
import { formatPerKm } from '@/shared/utils/format';
import { ProfitCard } from './ProfitCard';
import { useDashboard } from './useDashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const { data, error, reload } = useDashboard();

  if (error) return <Screen><Notice tone="negative" message={error} /></Screen>;
  if (!data) return <Screen>{null}</Screen>;

  return (
    <Screen>
      {data.copilotStopped ? (
        <EmptyState
          title="Copiloto em pausa"
          message="A permissão de acessibilidade foi desligada. Ative de novo para voltar a avaliar as ofertas."
          action={<Button label="Reativar o Copiloto" variant="secondary" onPress={() => router.push('/copilot')} />}
        />
      ) : null}
      {data.gpsRunning ? <Notice tone="accent" message="Medindo seus km por GPS. Em deslocamentos pessoais, é só pausar." /> : null}
      <ActiveShiftCard />
      <NextStepCard step={data.nextStep} onDismiss={reload} />
      <ProfitCard title="Lucro de hoje" summary={data.today} hero />
      {data.missingFixedCosts ? (
        <Notice tone="accent" message="Esse lucro ainda não considera seguro, IPVA, parcela ou aluguel. Inclua em Veículo e custos para ver o valor real." />
      ) : null}
      <Card>
        <LearnMore title="Por que o lucro é menor que o que recebi?">
          <AppText variant="caption">Parte do que você recebe paga o carro: combustível, desgaste, seguro e outros custos. Lucro é o que sobra depois disso.</AppText>
          {data.costs ? <AppText variant="caption">Hoje, cada km custa cerca de {formatPerKm(data.costs.fullPerKm)}.</AppText> : null}
        </LearnMore>
      </Card>
      <NewShiftButton />
      {data.goal ? <GoalProgressCard progress={data.goal} /> : null}
      {data.topInsight ? <InsightCard insight={data.topInsight} /> : null}
      {data.dueKmReminders.map((reminder) => (
        <Notice key={reminder.id} message={`Lembrete: ${reminder.title}`} />
      ))}
      {data.backupDue ? <Notice tone="accent" message="Que tal fazer um backup? Assim seus dados ficam guardados também fora do celular." /> : null}
      <ProfitCard title="Nesta semana" summary={data.week} />
      <ProfitCard title="Neste mês" summary={data.month} />
    </Screen>
  );
}
