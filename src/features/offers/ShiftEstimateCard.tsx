import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { estimateEarnings, inRange, matchPlatforms, OfferRange } from '@domain/offer/offerLog';
import { useFormat } from '@shared/i18n/format';
import { AppText, Button, Card, ListRow, Notice } from '@shared/ui/primitives';
import { useOfferHistory } from './useOfferHistory';

interface ShiftEstimateCardProps {
  range: OfferRange;
  platforms: { id: number; name: string }[];
  onApply: (platformId: number, text: string) => void;
}

export function ShiftEstimateCard({ range, platforms, onApply }: ShiftEstimateCardProps) {
  const { t } = useTranslation('offers');
  const format = useFormat();
  const { entries } = useOfferHistory(range);
  const [applied, setApplied] = useState(false);
  const estimate = useMemo(() => estimateEarnings(inRange(entries, range)), [entries, range]);
  const { matched, unmatched } = matchPlatforms(estimate, platforms);

  if (estimate.trips === 0) return null;

  const apply = () => {
    matched.forEach(({ platformId, cents }) => onApply(platformId, format.moneyInput(cents)));
    setApplied(true);
  };

  return (
    <Card title={t('shiftEstimate.title')}>
      <AppText tone="muted">{t('shiftEstimate.intro')}</AppText>
      {estimate.byPlatform.map((platform) => (
        <ListRow key={platform.source} title={platform.source} value={format.money(platform.cents)} />
      ))}
      <ListRow title={t('shiftEstimate.total')} value={format.money(estimate.totalCents)} />
      {unmatched.length > 0 ? <Notice message={t('shiftEstimate.unmatched', { platforms: unmatched.join(', ') })} /> : null}
      {applied ? <Notice tone="positive" message={t('shiftEstimate.applied')} /> : null}
      <Button label={t('shiftEstimate.apply')} variant="secondary" disabled={matched.length === 0} onPress={apply} />
    </Card>
  );
}
