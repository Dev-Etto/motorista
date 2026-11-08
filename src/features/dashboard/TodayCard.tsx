import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import type { TodayGoal } from '@domain/goal/todayGoal';
import type { ShiftSummary } from '@domain/shift/summary';
import { useFormat } from '@shared/i18n/format';
import { MIN_TOUCH_TARGET, spacing } from '@shared/theme/theme';
import { AppText, Card, Notice, ProgressBar, Stat, StatGrid } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';

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
          <AppText bold>{t('today.details')}</AppText>
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
      <StatGrid columns={3}>
        <Stat label={t('today.gross')} value={format.money(summary.grossCents)} />
        <Stat label={t('today.perKm', { context: format.distanceUnit })} value={format.perDistance(summary.grossPerKm)} />
        <Stat label={t('today.perHour')} value={format.perHour(summary.profitPerHour)} />
      </StatGrid>
      {summary.partialCount > 0 ? <Notice message={t('profitCard.partial', { context: format.distanceUnit, count: summary.partialCount })} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center', paddingLeft: spacing.md },
  goal: { gap: spacing.xs },
});
