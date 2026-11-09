import { useMemo } from 'react';
import { estimateEarnings, inRange, matchPlatforms, OfferRange } from '@domain/offer/offerLog';
import { useOfferHistory } from './useOfferHistory';

export function useAcceptedEarnings(range: OfferRange, platforms: { id: number; name: string }[]) {
  const { entries, loading } = useOfferHistory(range);
  const estimate = useMemo(() => estimateEarnings(inRange(entries, range)), [entries, range]);
  const { matched, unmatched } = useMemo(() => matchPlatforms(estimate, platforms), [estimate, platforms]);
  const tripsOf = (platformId: number) => matched.find((platform) => platform.platformId === platformId)?.trips ?? 0;

  return { loading, trips: estimate.trips, matched, unmatched, tripsOf };
}
