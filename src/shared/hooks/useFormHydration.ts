import { useEffect, useRef } from 'react';
import { useLatest } from './useLatest';

export function useFormHydration<T>(data: T | null | undefined, apply: (data: T) => void, key: string | number = 'once') {
  const hydratedKey = useRef<string | number | null>(null);
  const latestApply = useLatest(apply);

  useEffect(() => {
    if (data === null || data === undefined) return;
    if (hydratedKey.current === key) return;

    hydratedKey.current = key;
    latestApply.current(data);
  }, [data, key, latestApply]);
}
