import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ShiftSummary } from '@domain/shift/summary';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { AppText, Card } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';

function PeriodColumn({ label, summary }: { label: string; summary: ShiftSummary }) {
  const { t } = useTranslation('dashboard');
  const format = useFormat();
  const description = `${label}: ${format.money(summary.profitCents)}. ${t('periods.gross', { amount: format.money(summary.grossCents) })} ${t('periods.time', { duration: format.duration(summary.minutes) })}`;

  return (
    <View style={styles.column} accessible accessibilityLabel={description}>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText variant="title" bold tone={profitTone(summary.profitCents)}>
        {format.money(summary.profitCents)}
      </AppText>
      <AppText variant="caption" tone="muted">
        {t('periods.gross', { amount: format.money(summary.grossCents) })}
      </AppText>
      <AppText variant="caption" tone="muted">
        {t('periods.time', { duration: format.duration(summary.minutes) })}
      </AppText>
    </View>
  );
}

export function PeriodsCard({ week, month }: { week: ShiftSummary; month: ShiftSummary }) {
  const { t } = useTranslation('dashboard');
  return (
    <Card title={t('periodsTitle')}>
      <View style={styles.row}>
        <PeriodColumn label={t('periods.week')} summary={week} />
        <PeriodColumn label={t('periods.month')} summary={month} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.lg },
  column: { flex: 1, gap: spacing.xs },
});
