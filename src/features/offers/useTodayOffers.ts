import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { summarizeOfferDay } from '@domain/offer/offerLog';
import { copilot, OfferHistoryEntry } from '@modules/copilot';
import { dayRange, today } from '@shared/utils/dates';
import { reportError } from '@shared/utils/reportError';

const LIST_SIZE = 5;

export function useTodayOffers() {
  const [entries, setEntries] = useState<OfferHistoryEntry[]>([]);

  const refresh = useCallback(() => {
    const { from, to } = dayRange(today());
    copilot.getOffers(from, to).then((found) => setEntries([...found].sort((a, b) => b.timestamp - a.timestamp)), reportError);
  }, []);

  useFocusEffect(refresh);

  return { recent: entries.slice(0, LIST_SIZE), day: summarizeOfferDay(entries), refresh };
}
