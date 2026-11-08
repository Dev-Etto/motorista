import { useCallback, useRef, useState } from 'react';
import { i18n } from '@shared/i18n';
import { reportError } from '@shared/utils/reportError';
import { useLatest } from './useLatest';

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
      } catch (error) {
        reportError(error);
        setError(i18n.t('errors.save'));
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [latest],
  );

  return { busy, error, submit };
}
