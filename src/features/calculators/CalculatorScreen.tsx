import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@shared/i18n/format';
import { AppText, Screen } from '@shared/ui/primitives';
import { CostDependencyNotice } from './CostDependencyNotice';
import { OfferCalculator } from './OfferCalculator';
import { QuoteCalculator } from './QuoteCalculator';
import { useCostBasis } from './useCostPerKm';

const TABS = ['offer', 'quote'] as const;

type Tab = (typeof TABS)[number];

export default function CalculatorScreen() {
  const { t } = useTranslation('calculators');
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: Tab = TABS.find((value) => value === params.tab) ?? 'offer';
  const format = useFormat();
  const { costPerKm, vehicleName } = useCostBasis();

  return (
    <Screen>
      <Stack.Screen options={{ title: t(`tabs.${tab}`) }} />
      <CostDependencyNotice costPerKm={costPerKm} />
      {vehicleName && costPerKm > 0 ? (
        <AppText variant="caption" tone="muted">
          {t('costOf', { name: vehicleName, cost: format.perDistance(costPerKm) })}
        </AppText>
      ) : null}
      {tab === 'offer' ? <OfferCalculator costPerKm={costPerKm} /> : <QuoteCalculator costPerKm={costPerKm} />}
    </Screen>
  );
}
