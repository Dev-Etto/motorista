import { useCallback, useEffect, useState } from 'react';
import { useInterval } from '@shared/hooks/useInterval';
import { reportError } from '@shared/utils/reportError';
import { countUnseenOffers, markOffersSeen } from './unseenOffers';

const POLL_MS = 15_000;

export function useUnseenOffers(viewing: boolean): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!viewing) return setCount(await countUnseenOffers());

    await markOffersSeen();
    setCount(0);
  }, [viewing]);

  useEffect(() => {
    refresh().catch(reportError);
  }, [refresh]);
  useInterval(() => refresh().catch(reportError), POLL_MS);

  return count;
}
