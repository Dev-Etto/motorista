import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GoalProgressCard } from '@features/goals';
import { InsightCard } from '@features/insights';
import { NextStepCard } from '@features/onboarding';
import { ShiftControls } from '@features/shifts';
import { useFormat } from '@shared/i18n/format';
import { AsyncBoundary } from '@shared/ui/AsyncBoundary';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Button, Card, ListRow, Notice, Screen } from '@shared/ui/primitives';
import { PendingCard } from './PendingCard';
import { pendingItems } from './pendingItems';
import { PeriodsCard } from './PeriodsCard';
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
  const { t } = useTranslation(['dashboard', 'vehicle']);
  const format = useFormat();
  const unit = { context: format.distanceUnit };

  return (
    <>
      {data.copilotStopped ? (
        <Card title={t('copilotStopped.title')}>
          <Notice tone="negative" message={t('copilotStopped.message')} />
          <Button label={t('copilotStopped.action')} variant="secondary" onPress={() => router.push('/copilot')} />
        </Card>
      ) : null}
      {data.gpsRunning ? <Notice tone="accent" message={t('gpsRunning', unit)} /> : null}
      {data.gpsProblem ? <Notice tone="negative" message={t('gpsProblem', { ...unit, problem: data.gpsProblem })} /> : null}
      <ShiftControls />
      {data.currentVehicle ? (
        <Card>
          <ListRow
            icon={data.currentVehicle.kind === 'motorcycle' ? 'motorcycle' : 'vehicle'}
            title={t('vehicle:manage.currentRow')}
            value={data.currentVehicle.name}
            onPress={() => router.push('/vehicles')}
          />
        </Card>
      ) : null}
      <NextStepCard step={data.nextStep} onDismiss={onReload} />
      <ProfitCard title={t('todayTitle')} summary={data.today} hero />
      {data.estimatedToday && data.estimatedToday.trips > 0 ? (
        <Card>
          <ListRow
            icon="layers"
            title={t('estimated.title')}
            subtitle={t('estimated.subtitle')}
            value={format.money(data.estimatedToday.totalCents)}
            onPress={() => router.push('/offers')}
          />
        </Card>
      ) : null}
      {data.missingFixedCosts ? <Notice tone="accent" message={t('missingFixedCosts')} /> : null}
      <Card>
        <LearnMore title={t('whyLess.title')}>
          <AppText variant="caption">{t('whyLess.body')}</AppText>
          {data.costs ? <AppText variant="caption">{t('whyLess.costToday', { ...unit, cost: format.perDistance(data.costs.fullPerKm) })}</AppText> : null}
        </LearnMore>
      </Card>
      {data.goal ? <GoalProgressCard progress={data.goal} onOpenDetails={() => router.push('/goal')} /> : null}
      {data.topInsight ? <InsightCard insight={data.topInsight} /> : null}
      <PendingCard items={pendingItems(data)} />
      <PeriodsCard week={data.week} month={data.month} />
    </>
  );
}
