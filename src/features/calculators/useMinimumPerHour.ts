import { loadOfferSettings } from '@application/offerSettings';
import { activeTargets } from '@domain/offer/offer';
import { useAsyncData } from '@shared/hooks/useAsyncData';

export function useMinimumPerHour(): number | null {
  const { data } = useAsyncData(async () => activeTargets(await loadOfferSettings()).targetPerHourCents, []);
  return data && data > 0 ? data : null;
}
