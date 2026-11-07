import { OfferRange } from '@/domain/offer/offerLog';
import { useAsyncData } from '@/shared/hooks/useAsyncData';
import { copilot } from '@modules/copilot';

export function useOfferHistory({ from, to }: OfferRange) {
  const history = useAsyncData(() => copilot.getOffers(from, to), [from, to]);

  const clear = async () => {
    copilot.clearHistory();
    await history.reload();
  };

  return { entries: history.data ?? [], loading: history.loading, error: history.error, clear };
}
