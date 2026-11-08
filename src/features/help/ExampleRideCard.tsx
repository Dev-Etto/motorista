import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { spacing, useTheme } from '@shared/theme/theme';
import { AppText, Card } from '@shared/ui/primitives';
import { profitTone } from '@shared/utils/format';
import { useExampleCost } from './useExampleCost';

export const EXAMPLE_RIDE = { grossCents: 1800, km: 8.5 };
const FALLBACK_COST_PER_KM = 69;

export function ExampleRideCard() {
  const colors = useTheme();
  const format = useFormat();
  const { t } = useTranslation('help');
  const costPerKm = useExampleCost() ?? FALLBACK_COST_PER_KM;
  const costCents = Math.round(EXAMPLE_RIDE.km * costPerKm);
  const profitCents = EXAMPLE_RIDE.grossCents - costCents;

  return (
    <Card title={t('example.title')}>
      <Line label={t('example.gross')} value={format.money(EXAMPLE_RIDE.grossCents)} />
      <Line
        label={t('example.cost', { distance: format.distance(EXAMPLE_RIDE.km), cost: format.perDistance(costPerKm) })}
        value={`− ${format.money(costCents)}`}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Line label={t('example.profit')} value={format.money(profitCents)} tone={profitTone(profitCents)} big />
    </Card>
  );
}

function Line({ label, value, tone = 'default', big }: { label: string; value: string; tone?: 'default' | 'positive' | 'negative' | 'muted'; big?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={styles.line}>
      <AppText style={styles.flex}>{label}</AppText>
      <AppText variant={big ? 'title' : 'body'} bold tone={tone}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  line: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth },
});
