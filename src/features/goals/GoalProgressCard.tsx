import { useTranslation } from 'react-i18next';
import { loadGoalProgress } from '@application/goalProgress';
import { useFormat } from '@shared/i18n/format';
import { LearnMore } from '@shared/ui/LearnMore';
import { AppText, Button, Card, Notice, ProgressBar, Stat, StatGrid } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';
import { describeGoalDay, describePartialShifts } from './goalMessages';

type GoalProgress = NonNullable<Awaited<ReturnType<typeof loadGoalProgress>>>;

interface GoalProgressCardProps {
  progress: GoalProgress;
  onOpenDetails?: () => void;
}

export function GoalProgressCard({ progress, onOpenDetails }: GoalProgressCardProps) {
  const { t } = useTranslation('goals');
  const format = useFormat();
  return (
    <Card title={t('progress.title')}>
      <AppText bold tone={profitTone(progress.profitSoFarCents)}>
        {format.money(progress.profitSoFarCents)}{' '}
        <AppText tone="muted">{t('progress.ofProfit', { goal: format.money(progress.goal.desiredProfitCents) })}</AppText>
      </AppText>
      <ProgressBar progress={progress.progress} />
      {progress.reached ? null : (
        <StatGrid>
          {progress.dailyTargetCents === null || !progress.todayIsWorkDay ? null : (
            <>
              <Stat
                label={progress.dayOverride === null ? t('progress.todayTarget') : t('progress.todayTargetAdjusted')}
                value={format.money(progress.dailyTargetCents)}
              />
              <Stat label={t('progress.profitToday')} value={format.money(progress.profitTodayCents)} />
            </>
          )}
          <Stat label={t('progress.remaining')} value={format.money(progress.remainingCents)} />
        </StatGrid>
      )}
      <AppText variant="caption">{describeGoalDay(progress, t, format)}</AppText>
      {progress.partialCount > 0 ? <Notice message={describePartialShifts(progress.partialCount, t)} /> : null}
      {onOpenDetails ? <Button label={t('progress.openDetails')} variant="secondary" onPress={onOpenDetails} /> : null}
      {onOpenDetails ? null : (
        <LearnMore title={t('progress.howTitle')}>
          <AppText variant="caption">{t('progress.howProfit', { unit: format.distanceUnit })}</AppText>
          <AppText variant="caption">{t('progress.howFixed', { context: format.distanceUnit })}</AppText>
          <AppText variant="caption">{t('progress.howClosedMonth')}</AppText>
          <AppText variant="caption">{t('progress.howToday')}</AppText>
        </LearnMore>
      )}
    </Card>
  );
}
