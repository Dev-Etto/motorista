import { copilot, OfferHistoryEntry } from '@modules/copilot';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { OfferStatus } from '@/domain/offer/offerLog';

export function useOfferHistory() {
  const [entries, setEntries] = useState<OfferHistoryEntry[]>(() => copilot.getHistory());

  const refresh = useCallback(() => setEntries(copilot.getHistory()), []);

  useFocusEffect(refresh);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const setStatus = (offerId: number, status: OfferStatus) => {
    copilot.setOfferStatus(offerId, status);
    refresh();
  };

  const clear = () => {
    copilot.clearHistory();
    refresh();
  };

  return { entries, setStatus, clear };
}
