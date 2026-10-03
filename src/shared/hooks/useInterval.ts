import { useEffect } from 'react';
import { useLatest } from './useLatest';

export function useInterval(callback: () => void, delayMs: number | null): void {
  const latest = useLatest(callback);

  useEffect(() => {
    if (delayMs === null) return;

    const id = setInterval(() => latest.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs, latest]);
}
