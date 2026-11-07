import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { RELEASES_URL } from '@/config/app';
import { NextStepCard } from '@/features/onboarding/NextStepCard';
import { GoalProgressCard } from '@/features/goals/GoalProgressCard';
import { InsightCard } from '@/features/insights/InsightCard';
import { ActiveShiftCard, NewShiftButton } from '@/features/shifts/ActiveShift';
import { AsyncBoundary } from '@/shared/ui/AsyncBoundary';
import { LearnMore } from '@/shared/ui/LearnMore';
import { AppText, Button, Card, EmptyState, ListRow, Notice, Screen } from '@/shared/ui/primitives';
import { formatPerKm } from '@/shared/utils/format';
import { formatBRL } from '@/shared/utils/money';
import { ProfitCard } from './ProfitCard';
import { DashboardData, useDashboard } from './useDashboard';

export default function DashboardScreen() {
  const dashboard = useDashboard();

  return (
    <Screen>
      <AsyncBoundary state={dashboard}>{(data) => <DashboardContent data={data} onReload={dashboard.reload} />}</AsyncBoundary>
    </Screen>
  );
}

function DashboardContent({ data, onReload }: { data: DashboardData; onReload: () => Promise<void> }) {
  const router = useRouter();

  return (
    <>
      {data.copilotStopped ? (
        <EmptyState
          title="Copiloto em pausa"
          message="A permissão de acessibilidade foi desligada. Ative de novo para voltar a avaliar as ofertas."
          action={<Button label="Reativar o Copiloto" variant="secondary" onPress={() => router.push('/copilot')} />}
        />
      ) : null}
      {data.gpsRunning ? <Notice tone="accent" message="Medindo seus km por GPS. Em deslocamentos pessoais, é só pausar." /> : null}
      {data.gpsProblem ? <Notice tone="negative" message={`Os km não estão sendo medidos. ${data.gpsProblem}`} /> : null}
      <ActiveShiftCard />
      <NextStepCard step={data.nextStep} onDismiss={onReload} />
      <ProfitCard title="Lucro de hoje" summary={data.today} hero />
      {data.estimatedToday && data.estimatedToday.trips > 0 ? (
        <Card>
          <ListRow icon="layers" title="Faturamento estimado hoje" subtitle="Pelos aceites. Confira ao registrar a jornada." value={formatBRL(data.estimatedToday.totalCents)} onPress={() => router.push('/offers')} />
        </Card>
      ) : null}
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
      {data.goal ? <GoalProgressCard progress={data.goal} onOpenDetails={() => router.push('/goal')} /> : null}
      {data.topInsight ? <InsightCard insight={data.topInsight} /> : null}
      {data.dueKmReminders.map((reminder) => (
        <Notice key={reminder.id} message={`Lembrete: ${reminder.title}`} />
      ))}
      {data.backupDue ? (
        <>
          <Notice tone="accent" message="Que tal fazer um backup? Assim seus dados ficam guardados também fora do celular." />
          <Button label="Fazer backup" variant="secondary" onPress={() => router.push('/backup')} />
        </>
      ) : null}
      {data.updateDue ? (
        <>
          <Notice tone="accent" message="Esta versão do app já tem mais de um mês. Uma versão nova pode corrigir a leitura das ofertas." />
          <Button label="Verificar atualização" variant="secondary" onPress={() => Linking.openURL(RELEASES_URL)} />
        </>
      ) : null}
      <ProfitCard title="Nesta semana" summary={data.week} />
      <ProfitCard title="Neste mês" summary={data.month} />
    </>
  );
}
