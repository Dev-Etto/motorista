import { useState } from 'react';
import { Screen, Segmented } from '@/shared/ui/primitives';
import { CostDependencyNotice } from './CostDependencyNotice';
import { OfferCalculator } from './OfferCalculator';
import { QuoteCalculator } from './QuoteCalculator';
import { useCostPerKm } from './useCostPerKm';

type Tab = 'offer' | 'quote';

const TABS: { value: Tab; label: string }[] = [
  { value: 'offer', label: 'Avaliar oferta' },
  { value: 'quote', label: 'Corrida particular' },
];

export default function CalculatorScreen() {
  const [tab, setTab] = useState<Tab>('offer');
  const costPerKm = useCostPerKm();

  return (
    <Screen>
      <Segmented value={tab} options={TABS} onChange={setTab} />
      <CostDependencyNotice costPerKm={costPerKm} />
      {tab === 'offer' ? <OfferCalculator costPerKm={costPerKm} /> : <QuoteCalculator costPerKm={costPerKm} />}
    </Screen>
  );
}
