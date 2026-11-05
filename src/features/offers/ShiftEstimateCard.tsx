import { useMemo, useState } from 'react';
import { estimateEarnings, inRange, matchPlatforms, OfferRange } from '@/domain/offer/offerLog';
import { AppText, Button, Card, ListRow, Notice } from '@/shared/ui/primitives';
import { centsToInput, formatBRL } from '@/shared/utils/money';
import { useOfferHistory } from './useOfferHistory';

interface ShiftEstimateCardProps {
  range: OfferRange;
  platforms: { id: number; name: string }[];
  onApply: (platformId: number, text: string) => void;
}

export function ShiftEstimateCard({ range, platforms, onApply }: ShiftEstimateCardProps) {
  const { entries } = useOfferHistory();
  const [applied, setApplied] = useState(false);
  const estimate = useMemo(() => estimateEarnings(inRange(entries, range)), [entries, range]);
  const { matched, unmatched } = matchPlatforms(estimate, platforms);

  if (estimate.trips === 0) return null;

  const apply = () => {
    matched.forEach(({ platformId, cents }) => onApply(platformId, centsToInput(cents)));
    setApplied(true);
  };

  return (
    <Card title="Sugestão pelos aceites">
      <AppText tone="muted">Pelas corridas que o app viu você aceitar, estimamos este faturamento:</AppText>
      {estimate.byPlatform.map((platform) => (
        <ListRow key={platform.source} title={platform.source} value={formatBRL(platform.cents)} />
      ))}
      <ListRow title="Total estimado" value={formatBRL(estimate.totalCents)} />
      {unmatched.length > 0 ? <Notice message={`${unmatched.join(', ')} não está em Plataformas. Inclua para usar este valor.`} /> : null}
      {applied ? <Notice tone="positive" message="Valores preenchidos abaixo. Confira e ajuste antes de salvar." /> : null}
      <Button label="Usar estes valores" variant="secondary" disabled={matched.length === 0} onPress={apply} />
    </Card>
  );
}
