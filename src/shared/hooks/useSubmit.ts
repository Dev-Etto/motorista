import { useCallback, useRef, useState } from 'react';
import { useLatest } from './useLatest';

const SAVE_ERROR = 'Não foi possível salvar. Tente de novo.';

export function useSubmit<Args extends unknown[]>(action: (...args: Args) => Promise<unknown>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const latest = useLatest(action);

  const submit = useCallback(
    async (...args: Args) => {
      if (inFlight.current) return;

      inFlight.current = true;
      setBusy(true);
      setError(null);
      try {
        await latest.current(...args);
      } catch {
        setError(SAVE_ERROR);
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [latest],
  );

  return { busy, error, submit };
}
