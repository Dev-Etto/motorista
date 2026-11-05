import { copilot, OfferHistoryEntry } from '@modules/copilot';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { OfferRange } from '@/domain/offer/offerLog';

export function useOfferHistory({ from, to }: OfferRange) {
  const [entries, setEntries] = useState<OfferHistoryEntry[]>(() => copilot.getOffers(from, to));

  const refresh = useCallback(() => setEntries(copilot.getOffers(from, to)), [from, to]);

  useFocusEffect(refresh);
  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const clear = () => {
    copilot.clearHistory();
    refresh();
  };

  return { entries, clear };
}
