import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { TodayGoal } from '@domain/goal/todayGoal';
import type { ShiftSummary } from '@domain/shift/summary';
import { useLiveTracking } from '@features/shifts';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { AppText, Button, ButtonRow, Card, Notice, ProgressBar, Stat, StatGrid } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';
import { reportError } from '@shared/utils/reportError';

const ignoreApply = () => undefined;

export function TodayCard({ summary, goal }: { summary: ShiftSummary; goal: TodayGoal | null }) {
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const format = useFormat();
  const goalText = goal
    ? goal.remainingCents > 0
      ? t('today.goal', { percent: goal.percent, remaining: format.money(goal.remainingCents) })
      : t('today.goalReached', { percent: goal.percent })
    : null;

  return (
    <Card>
      <View style={styles.header}>
        <AppText bold tone="muted" accessibilityRole="header" style={styles.flex}>
          {t('today.title')}
        </AppText>
        <Pressable accessibilityRole="link" onPress={() => router.push('/goal')} style={styles.link}>
          <AppText bold>{t('today.seeGoal')}</AppText>
        </Pressable>
      </View>
      <AppText variant="display" bold tone={profitTone(summary.profitCents)}>
        {format.money(summary.profitCents)}
      </AppText>
      {goal && goalText ? (
        <View style={styles.goal}>
          <ProgressBar progress={goal.progress} />
          <AppText variant="caption" tone="muted">
            {goalText}
          </AppText>
        </View>
      ) : null}
      {summary.count === 0 ? (
        <EmptyDay />
      ) : (
        <StatGrid columns={3}>
          <Stat label={t('today.gross')} value={format.money(summary.grossCents)} />
          <Stat label={t('today.perKm', { context: format.distanceUnit })} value={format.perDistance(summary.grossPerKm)} />
          <Stat label={t('today.perHour')} value={format.perHour(summary.profitPerHour)} />
        </StatGrid>
      )}
      {summary.partialCount > 0 ? <Notice message={t('profitCard.partial', { context: format.distanceUnit, count: summary.partialCount })} /> : null}
    </Card>
  );
}

function EmptyDay() {
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const live = useLiveTracking(ignoreApply);

  if (live.started) return <AppText tone="muted">{t('today.emptyRunning')}</AppText>;

  return (
    <>
      <AppText tone="muted">{t('today.empty')}</AppText>
      <ButtonRow>
        <Button label={t('today.recordPast')} variant="secondary" onPress={() => router.push('/shift/new')} />
        <Button label={t('today.start')} onPress={() => void live.start().catch(reportError)} />
      </ButtonRow>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingLeft: spacing.md },
  goal: { gap: spacing.xs },
});
