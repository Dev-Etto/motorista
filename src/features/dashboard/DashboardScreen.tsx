import { useRouter } from 'expo-router';
import { GoalProgressCard } from '@/features/goals/GoalProgressCard';
import { InsightCard } from '@/features/insights/InsightCard';
import { Button, EmptyState, Notice, Screen } from '@/shared/ui/primitives';
import { ProfitCard } from './ProfitCard';
import { useDashboard } from './useDashboard';

export default function DashboardScreen() {
  const router = useRouter();
  const { data, error } = useDashboard();

  if (error) return <Screen><Notice tone="negative" message={error} /></Screen>;
  if (!data) return <Screen>{null}</Screen>;

  return (
    <Screen>
      {data.costs ? null : (
        <EmptyState
          title="Calcule seu custo por km"
          message="Sem os custos do veículo, o lucro mostrado fica incompleto."
          action={<Button label="Cadastrar veículo" variant="secondary" onPress={() => router.push('/vehicle')} />}
        />
      )}
      <ProfitCard title="Lucro de hoje" summary={data.today} hero />
      <Button label="Nova jornada" onPress={() => router.push('/shift/new')} />
      {data.goal ? <GoalProgressCard progress={data.goal} /> : null}
      {data.topInsight ? <InsightCard insight={data.topInsight} /> : null}
      {data.dueKmReminders.map((reminder) => (
        <Notice key={reminder.id} message={`Lembrete: ${reminder.title}`} />
      ))}
      {data.backupDue ? <Notice message="Faça um backup: se o app for desinstalado, seus dados são apagados." /> : null}
      <ProfitCard title="Nesta semana" summary={data.week} />
      <ProfitCard title="Neste mês" summary={data.month} />
    </Screen>
  );
}
