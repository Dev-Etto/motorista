import { useCallback, useRef, useState } from 'react';
import { useLatest } from './useLatest';

export function useSubmit(action: () => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const latest = useLatest(action);

  const submit = useCallback(async () => {
    if (inFlight.current) return;

    inFlight.current = true;
    setBusy(true);
    try {
      await latest.current();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [latest]);

  return { busy, submit };
}
