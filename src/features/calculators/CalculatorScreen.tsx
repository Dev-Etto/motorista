import { useState } from 'react';
import { Notice, Screen, Segmented } from '@/shared/ui/primitives';
import { OfferCalculator } from './OfferCalculator';
import { QuoteCalculator } from './QuoteCalculator';
import { useCostPerKm } from './useCostPerKm';

type Tab = 'offer' | 'quote';

const TABS: { value: Tab; label: string }[] = [
  { value: 'offer', label: 'Vale a pena?' },
  { value: 'quote', label: 'Particular' },
];

export default function CalculatorScreen() {
  const [tab, setTab] = useState<Tab>('offer');
  const costPerKm = useCostPerKm();

  return (
    <Screen>
      <Segmented value={tab} options={TABS} onChange={setTab} />
      {costPerKm > 0 ? null : <Notice message="Cadastre seu veículo em Mais para os cálculos considerarem seu custo." />}
      {tab === 'offer' ? <OfferCalculator costPerKm={costPerKm} /> : <QuoteCalculator costPerKm={costPerKm} />}
    </Screen>
  );
}
