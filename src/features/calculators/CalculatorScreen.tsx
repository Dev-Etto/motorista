import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Screen, Segmented } from '@shared/ui/primitives';
import { CostDependencyNotice } from './CostDependencyNotice';
import { OfferCalculator } from './OfferCalculator';
import { QuoteCalculator } from './QuoteCalculator';
import { useCostPerKm } from './useCostPerKm';

const TABS = ['offer', 'quote'] as const;

type Tab = (typeof TABS)[number];

export default function CalculatorScreen() {
  const { t } = useTranslation('calculators');
  const [tab, setTab] = useState<Tab>('offer');
  const costPerKm = useCostPerKm();
  const options = TABS.map((value) => ({ value, label: t(`tabs.${value}`) }));

  return (
    <Screen>
      <Segmented value={tab} options={options} onChange={setTab} />
      <CostDependencyNotice costPerKm={costPerKm} />
      {tab === 'offer' ? <OfferCalculator costPerKm={costPerKm} /> : <QuoteCalculator costPerKm={costPerKm} />}
    </Screen>
  );
}
