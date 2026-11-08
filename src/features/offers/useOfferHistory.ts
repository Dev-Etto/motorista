import { OfferRange } from '@domain/offer/offerLog';
import { copilot } from '@modules/copilot';
import { useAsyncData } from '@shared/hooks/useAsyncData';

export function useOfferHistory({ from, to }: OfferRange) {
  const history = useAsyncData(() => copilot.getOffers(from, to), [from, to]);

  const clear = async () => {
    copilot.clearHistory();
    await history.reload();
  };

  return { entries: history.data ?? [], loading: history.loading, error: history.error, clear, reload: history.reload };
}
