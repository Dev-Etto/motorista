import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useFormat } from '@shared/i18n/format';
import { spacing } from '@shared/theme/theme';
import { AppText, Screen, Segmented } from '@shared/ui/primitives';
import { CostDependencyNotice } from './CostDependencyNotice';
import { OfferCalculator } from './OfferCalculator';
import { QuoteCalculator } from './QuoteCalculator';
import { useCostBasis } from './useCostPerKm';

const TABS = ['offer', 'quote'] as const;

type Tab = (typeof TABS)[number];

export default function CalculatorScreen() {
  const { t } = useTranslation('calculators');
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(() => TABS.find((value) => value === params.tab) ?? 'offer');
  const format = useFormat();
  const { costPerKm, vehicleName } = useCostBasis();
  const options = TABS.map((value) => ({ value, label: t(`tabs.${value}`) }));

  return (
    <Screen>
      <Segmented value={tab} options={options} onChange={setTab} />
      <CostDependencyNotice costPerKm={costPerKm} />
      {vehicleName && costPerKm > 0 ? (
        <AppText variant="caption" tone="muted">
          {t('costOf', { name: vehicleName, cost: format.perDistance(costPerKm) })}
        </AppText>
      ) : null}
      <View style={tab === 'offer' ? styles.visible : styles.hidden}>
        <OfferCalculator costPerKm={costPerKm} />
      </View>
      <View style={tab === 'quote' ? styles.visible : styles.hidden}>
        <QuoteCalculator costPerKm={costPerKm} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  visible: { gap: spacing.lg },
  hidden: { display: 'none' },
});
