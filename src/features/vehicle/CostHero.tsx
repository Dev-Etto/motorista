import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { CostBreakdown } from '@domain/vehicle/costs';
import { costParts, costShares } from '@domain/vehicle/costShares';
import { useFormat } from '@shared/i18n/format';
import { radius, spacing, useTheme } from '@shared/theme/theme';
import { AppText, Card } from '@shared/ui/primitives';

const BAR_HEIGHT = 10;

export function CostHero({ costs }: { costs: CostBreakdown }) {
  const colors = useTheme();
  const format = useFormat();
  const { t } = useTranslation('vehicle');
  const parts = costParts(costs);
  const shares = costShares(costs);
  const breakdown = t('costHero.breakdown', {
    fuel: format.perDistance(parts.fuel),
    wear: format.perDistance(parts.wear),
    fixed: format.perDistance(parts.fixed),
  });
  const segments = [
    { key: 'fuel', share: shares.fuel, color: colors.primary },
    { key: 'wear', share: shares.wear, color: colors.borderStrong },
    { key: 'fixed', share: shares.fixed, color: colors.surfaceAlt },
  ];

  return (
    <Card>
      <AppText tone="muted" accessibilityRole="header">
        {t('costHero.title', { context: format.distanceUnit })}
      </AppText>
      <AppText variant="display" bold>
        {format.perDistance(costs.fullPerKm)}
      </AppText>
      <View accessible accessibilityLabel={breakdown} style={[styles.bar, { backgroundColor: colors.surfaceAlt }]}>
        {segments.map((segment) => (segment.share > 0 ? <View key={segment.key} style={{ flex: segment.share, backgroundColor: segment.color }} /> : null))}
      </View>
      <AppText variant="caption" tone="muted" importantForAccessibility="no-hide-descendants">
        {breakdown}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: { height: BAR_HEIGHT, borderRadius: radius.pill, overflow: 'hidden', flexDirection: 'row', marginVertical: spacing.xs },
});
