import { useTranslation } from 'react-i18next';
import { loadGoalProgress } from '@application/goalProgress';
import { useWorkProfile } from '@application/workProfile';
import { useFormat } from '@shared/i18n/format';
import { AppText, Card, ListRow, Notice } from '@shared/ui/primitives';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

export function GoalPlanCard({ progress }: { progress: GoalProgress }) {
  const { t } = useTranslation('goals');
  const workProfile = useWorkProfile();
  const format = useFormat();
  const { suggestion } = progress;
  if (!suggestion) return <Notice tone="accent" message={t('plan.noVehicle', { context: workProfile })} />;

  return (
    <Card title={t('plan.title')}>
      <AppText variant="caption" tone="muted">
        {t('plan.caption', { context: format.distanceUnit })}
      </AppText>
      <ListRow title={t('plan.gross')} value={format.money(progress.requiredGrossCents)} />
      <ListRow title={t('plan.perWorkDay')} value={format.money(suggestion.grossPerWorkDayCents)} />
      <ListRow title={t('plan.plannedDistance', { context: format.distanceUnit })} value={format.distance(progress.plannedKmPerDay, 0)} />
    </Card>
  );
}
